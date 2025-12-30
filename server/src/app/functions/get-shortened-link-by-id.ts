import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeLeft, makeRight } from '@/infra/shared/either'

const getShortenedLinkByIdInput = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
})

type GetShortenedLinkByIdInput = z.input<typeof getShortenedLinkByIdInput>

type GetShortenedLinkByIdOutput = {
  id: string
  url: string
  shortenedUrl: string
  visits: number
  createdAt: Date
  updatedAt: Date
}

export async function getShortenedLinkById(
  input: GetShortenedLinkByIdInput
): Promise<Either<Error, GetShortenedLinkByIdOutput>> {
  try {
    const { id } = getShortenedLinkByIdInput.parse(input)

    const shortenedLink = await db.query.shortenedLinks.findFirst({
      where: eq(schema.shortenedLinks.id, id),
    })

    if (!shortenedLink) {
      return makeLeft(new Error('Shortened link not found'))
    }

    return makeRight({
      id: shortenedLink.id,
      url: shortenedLink.url,
      shortenedUrl: shortenedLink.shortenedUrl,
      visits: shortenedLink.visits,
      createdAt: shortenedLink.createdAt,
      updatedAt: shortenedLink.updatedAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return makeLeft(
        new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`)
      )
    }

    return makeLeft(error instanceof Error ? error : new Error('Unknown error occurred'))
  }
}
