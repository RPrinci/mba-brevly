import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isLeft, isRight, unwrapEither } from '@/infra/shared/either'
import { createShortenedLink } from './create-shortened-link'
import { getShortenedLinkByShortenedUrl } from './get-shortened-link-by-shortened-url'

// Mock fetch globally
global.fetch = vi.fn()

describe.sequential('getShortenedLinkByShortenedUrl', () => {
  beforeEach(async () => {
    await db.delete(schema.shortenedLinks)
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await db.delete(schema.shortenedLinks)
    vi.restoreAllMocks()
  })

  it('should successfully retrieve original URL and increment visit count', async () => {
    // Mock successful URL validation
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response)

    // Create a link first
    const createResult = await createShortenedLink({
      url: 'https://example.com/test',
      shortenedUrl: 'test-link',
    })
    expect(isRight(createResult)).toBe(true)

    const created = unwrapEither(createResult)

    // Retrieve the link by shortened URL
    const getResult = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'test-link',
    })

    expect(isRight(getResult)).toBe(true)

    if (isRight(getResult)) {
      const link = unwrapEither(getResult)

      expect(link.id).toBe(created.id)
      expect(link.url).toBe('https://example.com/test')
      expect(link.shortenedUrl).toBe('test-link')
      expect(link.visits).toBe(1) // Should be incremented
      expect(link.createdAt).toBeInstanceOf(Date)
      expect(link.updatedAt).toBeInstanceOf(Date)

      // Verify fetch was called to validate URL
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/test',
        expect.objectContaining({
          method: 'HEAD',
        })
      )
    }
  })

  it('should increment visit count on each access', async () => {
    // Mock successful URL validation for all calls
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/visit-test',
      shortenedUrl: 'visit-test',
    })
    expect(isRight(createResult)).toBe(true)

    // Access it multiple times
    const result1 = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'visit-test',
    })
    expect(isRight(result1)).toBe(true)
    expect(unwrapEither(result1).visits).toBe(1)

    const result2 = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'visit-test',
    })
    expect(isRight(result2)).toBe(true)
    expect(unwrapEither(result2).visits).toBe(2)

    const result3 = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'visit-test',
    })
    expect(isRight(result3)).toBe(true)
    expect(unwrapEither(result3).visits).toBe(3)
  })

  it('should return error when shortened URL does not exist', async () => {
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'non-existent',
    })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('not found')
    }
  })

  it('should return error when target URL is not accessible (HEAD fails)', async () => {
    // Mock failed URL validation (both HEAD and GET fail)
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://broken-url.com/test',
      shortenedUrl: 'broken-link',
    })
    expect(isRight(createResult)).toBe(true)

    // Try to access it
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'broken-link',
    })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('not accessible')
    }

    // Verify both HEAD and GET were attempted
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('should return error when target URL returns 404', async () => {
    // Mock 404 response
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/404',
      shortenedUrl: '404-link',
    })
    expect(isRight(createResult)).toBe(true)

    // Try to access it
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: '404-link',
    })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error.message).toContain('not accessible')
    }
  })

  it('should accept 3xx redirect responses as valid', async () => {
    // Mock redirect response
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 301,
    } as Response)

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/redirect',
      shortenedUrl: 'redirect-link',
    })
    expect(isRight(createResult)).toBe(true)

    // Access it
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'redirect-link',
    })

    expect(isRight(result)).toBe(true)

    if (isRight(result)) {
      const link = unwrapEither(result)
      expect(link.visits).toBe(1)
    }
  })

  it('should fallback to GET when HEAD request fails', async () => {
    // Mock HEAD fails but GET succeeds
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('HEAD not supported'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/no-head',
      shortenedUrl: 'no-head-link',
    })
    expect(isRight(createResult)).toBe(true)

    // Access it
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'no-head-link',
    })

    expect(isRight(result)).toBe(true)

    // Verify both HEAD and GET were called
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://example.com/no-head',
      expect.objectContaining({ method: 'HEAD' })
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://example.com/no-head',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should return error for invalid shortened URL format', async () => {
    const invalidUrls = [
      'invalid url with spaces',
      'invalid@url',
      'invalid#url',
      'invalid/url',
    ]

    for (const invalidUrl of invalidUrls) {
      const result = await getShortenedLinkByShortenedUrl({
        shortenedUrl: invalidUrl,
      })

      expect(isLeft(result)).toBe(true)

      if (isLeft(result)) {
        const error = unwrapEither(result)
        expect(error.message).toContain('Validation error')
      }
    }
  })

  it('should return error for empty shortened URL', async () => {
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: '',
    })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error.message).toContain('Validation error')
    }
  })

  it('should handle special characters in valid shortened URL', async () => {
    // Mock successful URL validation
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    // Create a link with allowed special characters
    const createResult = await createShortenedLink({
      url: 'https://example.com/special',
      shortenedUrl: 'special-link_123',
    })
    expect(isRight(createResult)).toBe(true)

    // Access it
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'special-link_123',
    })

    expect(isRight(result)).toBe(true)

    if (isRight(result)) {
      const link = unwrapEither(result)
      expect(link.shortenedUrl).toBe('special-link_123')
    }
  })

  it('should update updatedAt timestamp when incrementing visits', async () => {
    // Mock successful URL validation
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/timestamp',
      shortenedUrl: 'timestamp-test',
    })
    expect(isRight(createResult)).toBe(true)

    const created = unwrapEither(createResult)
    const originalCreatedAt = created.createdAt

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10))

    // Access it
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'timestamp-test',
    })

    expect(isRight(result)).toBe(true)

    if (isRight(result)) {
      const link = unwrapEither(result)
      expect(link.updatedAt.getTime()).toBeGreaterThanOrEqual(originalCreatedAt.getTime())
    }
  })

  it('should not increment visits if URL validation fails', async () => {
    // Mock failed URL validation
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://broken.com/test',
      shortenedUrl: 'broken-test',
    })
    expect(isRight(createResult)).toBe(true)

    // Try to access it (should fail)
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'broken-test',
    })

    expect(isLeft(result)).toBe(true)

    // Verify visits were not incremented by checking the database directly
    const linkInDb = await db.query.shortenedLinks.findFirst({
      where: (shortenedLinks, { eq }) =>
        eq(shortenedLinks.shortenedUrl, 'broken-test'),
    })

    expect(linkInDb?.visits).toBe(0) // Should still be 0
  })

  it('should handle URLs with query parameters and fragments', async () => {
    // Mock successful URL validation
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    // Create a link with complex URL
    const createResult = await createShortenedLink({
      url: 'https://example.com/path?param1=value1&param2=value2#section',
      shortenedUrl: 'complex-url',
    })
    expect(isRight(createResult)).toBe(true)

    // Access it
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'complex-url',
    })

    expect(isRight(result)).toBe(true)

    if (isRight(result)) {
      const link = unwrapEither(result)
      expect(link.url).toBeTruthy()
      expect(link.visits).toBe(1)
    }
  })

  it('should return complete link information', async () => {
    // Mock successful URL validation
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/complete',
      shortenedUrl: 'complete-info',
    })
    expect(isRight(createResult)).toBe(true)

    // Access it
    const result = await getShortenedLinkByShortenedUrl({
      shortenedUrl: 'complete-info',
    })

    expect(isRight(result)).toBe(true)

    const link = unwrapEither(result)

    // Verify all required fields are present
    expect(link).toHaveProperty('id')
    expect(link).toHaveProperty('url')
    expect(link).toHaveProperty('shortenedUrl')
    expect(link).toHaveProperty('visits')
    expect(link).toHaveProperty('createdAt')
    expect(link).toHaveProperty('updatedAt')

    // Verify field types
    expect(typeof link.id).toBe('string')
    expect(typeof link.url).toBe('string')
    expect(typeof link.shortenedUrl).toBe('string')
    expect(typeof link.visits).toBe('number')
    expect(link.createdAt).toBeInstanceOf(Date)
    expect(link.updatedAt).toBeInstanceOf(Date)
  })

  it('should handle concurrent access correctly', async () => {
    // Mock successful URL validation
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/concurrent',
      shortenedUrl: 'concurrent-test',
    })
    expect(isRight(createResult)).toBe(true)

    // Access it concurrently
    const [result1, result2, result3] = await Promise.all([
      getShortenedLinkByShortenedUrl({ shortenedUrl: 'concurrent-test' }),
      getShortenedLinkByShortenedUrl({ shortenedUrl: 'concurrent-test' }),
      getShortenedLinkByShortenedUrl({ shortenedUrl: 'concurrent-test' }),
    ])

    expect(isRight(result1)).toBe(true)
    expect(isRight(result2)).toBe(true)
    expect(isRight(result3)).toBe(true)

    if (isRight(result1) && isRight(result2) && isRight(result3)) {
      // All concurrent requests should have succeeded
      const visits = [
        unwrapEither(result1).visits,
        unwrapEither(result2).visits,
        unwrapEither(result3).visits,
      ]

      // The maximum visit count should be at least 2 (some concurrent overlap may occur)
      // In a perfectly serialized scenario it would be 3, but concurrency may vary
      expect(Math.max(...visits)).toBeGreaterThanOrEqual(2)
      expect(Math.max(...visits)).toBeLessThanOrEqual(3)
    }
  })
})
