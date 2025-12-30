import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeLeft, makeRight } from '@/infra/shared/either'

const deleteShortenedLinkInput = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
})

type DeleteShortenedLinkInput = z.input<typeof deleteShortenedLinkInput>

export async function deleteShortenedLink(
  input: DeleteShortenedLinkInput
): Promise<Either<Error, null>> {
  try {
    const { id } = deleteShortenedLinkInput.parse(input)

    // Check if the shortened link exists
    const existingLink = await db.query.shortenedLinks.findFirst({
      where: eq(schema.shortenedLinks.id, id),
    })

    if (!existingLink) {
      return makeLeft(new Error('Shortened link not found'))
    }

    // Delete the shortened link
    await db.delete(schema.shortenedLinks).where(eq(schema.shortenedLinks.id, id))

    return makeRight(null)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return makeLeft(
        new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`)
      )
    }

    return makeLeft(error instanceof Error ? error : new Error('Unknown error occurred'))
  }
}
