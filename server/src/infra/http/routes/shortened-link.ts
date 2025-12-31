import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { createShortenedLink } from '@/app/functions/create-shortened-link'
import { deleteShortenedLink } from '@/app/functions/delete-shortened-link'
import { exportShortenedLinksCsv } from '@/app/functions/export-shortened-links-csv'
import { getShortenedLinkById } from '@/app/functions/get-shortened-link-by-id'
import { getShortenedLinkByShortenedUrl } from '@/app/functions/get-shortened-link-by-shortened-url'
import { getShortenedLinks } from '@/app/functions/get-shortened-links'
import { isLeft, unwrapEither } from '@/infra/shared/either'

export const shortenedLinkRoutes: FastifyPluginAsyncZod = async server => {
  server.get(
    '/shortened-links',
    {
      schema: {
        tags: ['shortened-links'],
        summary: 'List shortened links',
        description:
          'Retrieves a paginated list of shortened links with optional search and sorting. Search works on both URL and shortened URL fields.',
        querystring: z.object({
          searchQuery: z
            .string()
            .optional()
            .describe('Search term to filter by URL or shortened URL'),
          sortBy: z
            .enum(['createdAt', 'url', 'shortenedUrl', 'visits'])
            .optional()
            .describe('Field to sort by'),
          sortDirection: z
            .enum(['asc', 'desc'])
            .optional()
            .describe('Sort direction (ascending or descending)'),
          page: z
            .string()
            .optional()
            .transform(val => (val ? Number(val) : 1))
            .describe('Page number (default: 1)'),
          pageSize: z
            .string()
            .optional()
            .transform(val => (val ? Number(val) : 20))
            .describe('Number of items per page (default: 20)'),
        }),
        response: {
          200: z
            .object({
              shortenedLinks: z.array(
                z.object({
                  id: z.string().describe('The unique identifier'),
                  url: z.string().describe('The original URL'),
                  shortenedUrl: z.string().describe('The shortened URL identifier'),
                  visits: z.number().describe('Number of times the link has been visited'),
                  createdAt: z.string().describe('Creation timestamp'),
                  updatedAt: z.string().describe('Last update timestamp'),
                })
              ),
              total: z.number().describe('Total number of shortened links'),
              page: z.number().describe('Current page number'),
              pageSize: z.number().describe('Number of items per page'),
              totalPages: z.number().describe('Total number of pages'),
            })
            .describe('Successfully retrieved shortened links'),
        },
      },
    },
    async (request, reply) => {
      const { searchQuery, sortBy, sortDirection, page, pageSize } = request.query

      const result = await getShortenedLinks({
        searchQuery,
        sortBy,
        sortDirection,
        page,
        pageSize,
      })

      const data = unwrapEither(result)

      return reply.status(200).send({
        shortenedLinks: data.shortenedLinks.map(link => ({
          id: link.id,
          url: link.url,
          shortenedUrl: link.shortenedUrl,
          visits: link.visits,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt.toISOString(),
        })),
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      })
    }
  )

  server.get(
    '/shortened-links/export/csv',
    {
      schema: {
        tags: ['shortened-links'],
        summary: 'Export shortened links to CSV',
        description:
          'Downloads a CSV file containing all shortened links with their complete information. The file includes ID, URL, shortened URL, visit count, and timestamps.',
        response: {
          200: z.string().describe('CSV file content with all shortened links'),
        },
      },
    },
    async (request, reply) => {
      const result = await exportShortenedLinksCsv()

      const data = unwrapEither(result)

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename="shortened-links.csv"')
        .status(200)
        .send(data.csv)
    }
  )

  server.get(
    '/shortened-links/:id',
    {
      schema: {
        tags: ['shortened-links'],
        summary: 'Get a shortened link by ID',
        description:
          'Retrieves a single shortened link by its unique identifier. Returns the complete link information including visit count and timestamps.',
        params: z.object({
          id: z.string().uuid({ message: 'Invalid ID format' }).describe('The unique identifier of the shortened link'),
        }),
        response: {
          200: z
            .object({
              id: z.string().describe('The unique identifier'),
              url: z.string().describe('The original URL'),
              shortenedUrl: z.string().describe('The shortened URL identifier'),
              visits: z.number().describe('Number of times the link has been visited'),
              createdAt: z.string().describe('Creation timestamp'),
              updatedAt: z.string().describe('Last update timestamp'),
            })
            .describe('Successfully retrieved shortened link'),
          400: z
            .object({
              message: z.string(),
            })
            .describe('Validation error - invalid ID format'),
          404: z
            .object({
              message: z.string(),
            })
            .describe('Not found - shortened link does not exist'),
          500: z
            .object({
              message: z.string(),
            })
            .describe('Internal server error'),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const result = await getShortenedLinkById({ id })

      if (isLeft(result)) {
        const error = unwrapEither(result)

        if (error.message.includes('Validation error')) {
          return reply.status(400).send({
            message: error.message,
          })
        }

        if (error.message.includes('not found')) {
          return reply.status(404).send({
            message: error.message,
          })
        }

        return reply.status(500).send({
          message: 'An unexpected error occurred',
        })
      }

      const shortenedLink = unwrapEither(result)

      return reply.status(200).send({
        id: shortenedLink.id,
        url: shortenedLink.url,
        shortenedUrl: shortenedLink.shortenedUrl,
        visits: shortenedLink.visits,
        createdAt: shortenedLink.createdAt.toISOString(),
        updatedAt: shortenedLink.updatedAt.toISOString(),
      })
    }
  )

  server.get(
    '/shortened-links/shortened/:shortenedUrl',
    {
      schema: {
        tags: ['shortened-links'],
        summary: 'Get original URL by shortened URL',
        description:
          'Retrieves the original URL for a shortened link. This endpoint validates that the target URL is accessible, increments the visit count, and returns the original URL. Returns 404 if the shortened link does not exist or if the target URL is not accessible.',
        params: z.object({
          shortenedUrl: z
            .string()
            .min(1)
            .regex(
              /^[a-zA-Z0-9_-]+$/,
              'Shortened URL must contain only alphanumeric characters, hyphens, and underscores'
            )
            .describe('The shortened URL identifier'),
        }),
        response: {
          200: z
            .object({
              id: z.string().describe('The unique identifier'),
              url: z.string().describe('The original URL'),
              shortenedUrl: z.string().describe('The shortened URL identifier'),
              visits: z.number().describe('Number of times the link has been visited (after increment)'),
              createdAt: z.string().describe('Creation timestamp'),
              updatedAt: z.string().describe('Last update timestamp'),
            })
            .describe('Successfully retrieved original URL'),
          400: z
            .object({
              message: z.string(),
            })
            .describe('Validation error - invalid shortened URL format'),
          404: z
            .object({
              message: z.string(),
            })
            .describe('Not found - shortened link does not exist or target URL is not accessible'),
          500: z
            .object({
              message: z.string(),
            })
            .describe('Internal server error'),
        },
      },
    },
    async (request, reply) => {
      const { shortenedUrl } = request.params

      const result = await getShortenedLinkByShortenedUrl({ shortenedUrl })

      if (isLeft(result)) {
        const error = unwrapEither(result)

        if (error.message.includes('Validation error')) {
          return reply.status(400).send({
            message: error.message,
          })
        }

        if (error.message.includes('not found') || error.message.includes('not accessible')) {
          return reply.status(404).send({
            message: error.message,
          })
        }

        return reply.status(500).send({
          message: 'An unexpected error occurred',
        })
      }

      const shortenedLink = unwrapEither(result)

      return reply.status(200).send({
        id: shortenedLink.id,
        url: shortenedLink.url,
        shortenedUrl: shortenedLink.shortenedUrl,
        visits: shortenedLink.visits,
        createdAt: shortenedLink.createdAt.toISOString(),
        updatedAt: shortenedLink.updatedAt.toISOString(),
      })
    }
  )

  server.post(
    '/shortened-links',
    {
      schema: {
        tags: ['shortened-links'],
        summary: 'Create a shortened link',
        description:
          'Creates a new shortened link. The URL will be normalized (trailing slashes removed, query parameters sorted) for consistency. The shortened URL must be unique and contain only alphanumeric characters, hyphens, and underscores.',
        body: z.object({
          url: z.string().url({ message: 'Invalid URL format' }).max(2048).describe('The original URL to shorten'),
          shortenedUrl: z
            .string()
            .min(1)
            .max(50)
            .regex(
              /^[a-zA-Z0-9_-]+$/,
              'Shortened URL must contain only alphanumeric characters, hyphens, and underscores'
            )
            .describe('The unique shortened URL identifier (e.g., "abc123")'),
        }),
        response: {
          201: z
            .object({
              id: z.string().describe('The unique identifier of the shortened link'),
              url: z.string().describe('The normalized original URL'),
              shortenedUrl: z.string().describe('The shortened URL identifier'),
              createdAt: z.string().describe('The creation timestamp'),
            })
            .describe('Successfully created shortened link'),
          400: z
            .object({
              message: z.string(),
            })
            .describe('Validation error - invalid input'),
          409: z
            .object({
              message: z.string(),
            })
            .describe('Conflict - shortened URL already exists'),
          500: z
            .object({
              message: z.string(),
            })
            .describe('Internal server error'),
        },
      },
    },
    async (request, reply) => {
      const { url, shortenedUrl } = request.body

      const result = await createShortenedLink({ url, shortenedUrl })

      if (isLeft(result)) {
        const error = unwrapEither(result)

        if (error.message.includes('Validation error')) {
          return reply.status(400).send({
            message: error.message,
          })
        }

        if (error.message.includes('already exists')) {
          return reply.status(409).send({
            message: error.message,
          })
        }

        return reply.status(500).send({
          message: 'An unexpected error occurred',
        })
      }

      const shortenedLink = unwrapEither(result)

      return reply.status(201).send({
        id: shortenedLink.id,
        url: shortenedLink.url,
        shortenedUrl: shortenedLink.shortenedUrl,
        createdAt: shortenedLink.createdAt.toISOString(),
      })
    }
  )

  server.delete(
    '/shortened-links/:id',
    {
      schema: {
        tags: ['shortened-links'],
        summary: 'Delete a shortened link',
        description:
          'Deletes a shortened link by its unique identifier. This action is permanent and cannot be undone.',
        params: z.object({
          id: z.string().uuid({ message: 'Invalid ID format' }).describe('The unique identifier of the shortened link to delete'),
        }),
        response: {
          204: z.void().describe('Successfully deleted - no content returned'),
          400: z
            .object({
              message: z.string(),
            })
            .describe('Validation error - invalid ID format'),
          404: z
            .object({
              message: z.string(),
            })
            .describe('Not found - shortened link does not exist'),
          500: z
            .object({
              message: z.string(),
            })
            .describe('Internal server error'),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const result = await deleteShortenedLink({ id })

      if (isLeft(result)) {
        const error = unwrapEither(result)

        if (error.message.includes('Validation error')) {
          return reply.status(400).send({
            message: error.message,
          })
        }

        if (error.message.includes('not found')) {
          return reply.status(404).send({
            message: error.message,
          })
        }

        return reply.status(500).send({
          message: 'An unexpected error occurred',
        })
      }

      return reply.status(204).send()
    }
  )
}
