import { z } from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { type Either, makeLeft, makeRight } from '@/infra/shared/either'

const shortenedLinkInput = z.object({
  url: z.url({ message: 'Invalid URL format' }).max(2048),
  shortenedUrl: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Shortened URL must contain only alphanumeric characters, hyphens, and underscores'
    ),
})

type ShortenedLinkInput = z.input<typeof shortenedLinkInput>

type ShortenedLinkOutput = {
  id: string
  url: string
  shortenedUrl: string
  createdAt: Date
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove trailing slash from pathname (but keep root /)
    if (urlObj.pathname !== '/') {
      urlObj.pathname = urlObj.pathname.replace(/\/+$/, '')
    }
    // Sort query parameters for consistency
    if (urlObj.search) {
      const params = Array.from(urlObj.searchParams.entries())
      params.sort((a, b) => a[0].localeCompare(b[0]))
      urlObj.search = new URLSearchParams(params).toString()
    }
    // Remove trailing slash from URL if pathname is just '/' and no query/hash
    let normalized = urlObj.toString()
    if (urlObj.pathname === '/' && !urlObj.search && !urlObj.hash) {
      normalized = normalized.replace(/\/$/, '')
    }
    return normalized
  } catch {
    return url
  }
}

export async function createShortenedLink(
  input: ShortenedLinkInput
): Promise<Either<Error, ShortenedLinkOutput>> {
  try {
    const { url, shortenedUrl } = shortenedLinkInput.parse(input)

    const normalizedUrl = normalizeUrl(url)

    const [created] = await db
      .insert(schema.shortenedLinks)
      .values({
        url: normalizedUrl,
        shortenedUrl,
      })
      .returning()

    return makeRight({
      id: created.id,
      url: created.url,
      shortenedUrl: created.shortenedUrl,
      createdAt: created.createdAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return makeLeft(
        new Error(
          `Validation error: ${error.issues.map((e) => e.message).join(', ')}`
        )
      )
    }

    // Handle database unique constraint violations
    if (
      error instanceof Error &&
      (error.message.includes('unique') ||
       error.message.includes('shortened_url') ||
       error.message.includes('duplicate key'))
    ) {
      return makeLeft(new Error('Shortened URL already exists'))
    }

    return makeLeft(
      error instanceof Error ? error : new Error('Unknown error occurred')
    )
  }
}
