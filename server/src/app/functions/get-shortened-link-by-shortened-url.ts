import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeLeft, makeRight } from '@/infra/shared/either'

const getShortenedLinkByShortenedUrlInput = z.object({
  shortenedUrl: z
    .string()
    .min(1)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Shortened URL must contain only alphanumeric characters, hyphens, and underscores'
    ),
})

type GetShortenedLinkByShortenedUrlInput = z.input<
  typeof getShortenedLinkByShortenedUrlInput
>

type GetShortenedLinkByShortenedUrlOutput = {
  id: string
  url: string
  shortenedUrl: string
  visits: number
  createdAt: Date
  updatedAt: Date
}

async function validateUrlIsAccessible(url: string): Promise<boolean> {
  try {
    // First validate the URL format
    new URL(url)

    // Check if the URL is accessible with a HEAD request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    // Consider 2xx and 3xx status codes as valid
    return response.ok || (response.status >= 300 && response.status < 400)
  } catch (error) {
    // If HEAD fails, try GET request as some servers don't support HEAD
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
      })

      clearTimeout(timeoutId)

      return response.ok || (response.status >= 300 && response.status < 400)
    } catch {
      return false
    }
  }
}

export async function getShortenedLinkByShortenedUrl(
  input: GetShortenedLinkByShortenedUrlInput
): Promise<Either<Error, GetShortenedLinkByShortenedUrlOutput>> {
  try {
    const { shortenedUrl } = getShortenedLinkByShortenedUrlInput.parse(input)

    // Look up the shortened link
    const shortenedLink = await db.query.shortenedLinks.findFirst({
      where: eq(schema.shortenedLinks.shortenedUrl, shortenedUrl),
    })

    if (!shortenedLink) {
      return makeLeft(new Error('Shortened link not found'))
    }

    // Validate the target URL is accessible
    const isAccessible = await validateUrlIsAccessible(shortenedLink.url)

    if (!isAccessible) {
      return makeLeft(new Error('Target URL is not accessible or invalid'))
    }

    // Increment visit count
    const [updated] = await db
      .update(schema.shortenedLinks)
      .set({
        visits: shortenedLink.visits + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.shortenedLinks.id, shortenedLink.id))
      .returning()

    return makeRight({
      id: updated.id,
      url: updated.url,
      shortenedUrl: updated.shortenedUrl,
      visits: updated.visits,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
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
