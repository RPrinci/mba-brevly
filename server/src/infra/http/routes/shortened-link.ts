import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const shortenedLinkRoutes: FastifyPluginAsyncZod = async server => {
  server.post(
    '/shortened-links',
    {
      schema: {
        tags: ['shortened-links'],
        summary: 'Create a shortened link',
        description: 'Create a shortened link',
        body: z.object({
          url: z.url(),
          shortenedUrl: z.string(),
        }),
        response: {
          201: z.object({
            shortenedUrl: z.string(),
          }),
          409: z
            .object({
              message: z.string(),
            })
            .describe('Shortened link already exists'),
        },
      },
    },
    async (request, reply) => {
      return reply.status(201).send({
        shortenedUrl: 'https://brev.ly/1234567890',
      })
    }
  )
}
