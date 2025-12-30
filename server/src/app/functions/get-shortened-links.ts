import { asc, count, desc, ilike, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeRight } from '@/infra/shared/either'

const getShortenedLinksInput = z.object({
  searchQuery: z.string().optional(),
  sortBy: z.enum(['createdAt', 'url', 'shortenedUrl', 'visits']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(20),
})

type GetShortenedLinksInput = z.input<typeof getShortenedLinksInput>

type GetShortenedLinksOutput = {
  shortenedLinks: {
    id: string
    url: string
    shortenedUrl: string
    visits: number
    createdAt: Date
    updatedAt: Date
  }[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getShortenedLinks(
  input: GetShortenedLinksInput
): Promise<Either<never, GetShortenedLinksOutput>> {
  const { page, pageSize, searchQuery, sortBy, sortDirection } =
    getShortenedLinksInput.parse(input)

  const [shortenedLinks, [{ total }]] = await Promise.all([
    db
      .select({
        id: schema.shortenedLinks.id,
        url: schema.shortenedLinks.url,
        shortenedUrl: schema.shortenedLinks.shortenedUrl,
        visits: schema.shortenedLinks.visits,
        createdAt: schema.shortenedLinks.createdAt,
        updatedAt: schema.shortenedLinks.updatedAt,
      })
      .from(schema.shortenedLinks)
      .where(
        searchQuery
          ? or(
              ilike(schema.shortenedLinks.url, `%${searchQuery}%`),
              ilike(schema.shortenedLinks.shortenedUrl, `%${searchQuery}%`)
            )
          : undefined
      )
      .orderBy(fields => {
        if (sortBy && sortDirection === 'asc') {
          return asc(fields[sortBy])
        }

        if (sortBy && sortDirection === 'desc') {
          return desc(fields[sortBy])
        }

        return desc(fields.createdAt)
      })
      .offset((page - 1) * pageSize)
      .limit(pageSize),

    db
      .select({ total: count(schema.shortenedLinks.id) })
      .from(schema.shortenedLinks)
      .where(
        searchQuery
          ? or(
              ilike(schema.shortenedLinks.url, `%${searchQuery}%`),
              ilike(schema.shortenedLinks.shortenedUrl, `%${searchQuery}%`)
            )
          : undefined
      ),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return makeRight({
    shortenedLinks,
    total,
    page,
    pageSize,
    totalPages,
  })
}
