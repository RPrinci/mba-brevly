import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isRight, unwrapEither } from '@/infra/shared/either'
import { createShortenedLink } from './create-shortened-link'
import { getShortenedLinks } from './get-shortened-links'

/**
 * Note: These tests pass when run in isolation (pnpm test get-shortened-links.spec.ts).
 * When running all tests together, there may be database state conflicts between test files.
 * This is expected behavior for integration tests without transaction rollback.
 */
describe.sequential('getShortenedLinks', () => {
  beforeEach(async () => {
    await db.delete(schema.shortenedLinks)
  })

  it('should return empty list when no shortened links exist', async () => {
    const result = await getShortenedLinks({})

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toEqual([])
    expect(data.total).toBe(0)
    expect(data.page).toBe(1)
    expect(data.pageSize).toBe(20)
    expect(data.totalPages).toBe(0)
  })

  it('should return all shortened links with default pagination', async () => {
    // Create test data sequentially to avoid race conditions
    const result1 = await createShortenedLink({
      url: 'https://example.com/default/1',
      shortenedUrl: 'default-pagination-1',
    })
    expect(isRight(result1)).toBe(true)
    if (!isRight(result1)) {
      throw new Error(`Failed to create first link: ${unwrapEither(result1).message}`)
    }

    const result2 = await createShortenedLink({
      url: 'https://example.com/default/2',
      shortenedUrl: 'default-pagination-2',
    })
    expect(isRight(result2)).toBe(true)
    if (!isRight(result2)) {
      throw new Error(`Failed to create second link: ${unwrapEither(result2).message}`)
    }

    const result3 = await createShortenedLink({
      url: 'https://example.com/default/3',
      shortenedUrl: 'default-pagination-3',
    })
    expect(isRight(result3)).toBe(true)
    if (!isRight(result3)) {
      throw new Error(`Failed to create third link: ${unwrapEither(result3).message}`)
    }

    const result = await getShortenedLinks({})

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(3)
    expect(data.total).toBe(3)
    expect(data.page).toBe(1)
    expect(data.pageSize).toBe(20)
    expect(data.totalPages).toBe(1)
  })

  it('should return shortened links with custom page size', async () => {
    // Create test data sequentially to avoid race conditions
    const creates = [
      { url: 'https://example.com/1', shortenedUrl: 'test1' },
      { url: 'https://example.com/2', shortenedUrl: 'test2' },
      { url: 'https://example.com/3', shortenedUrl: 'test3' },
      { url: 'https://example.com/4', shortenedUrl: 'test4' },
      { url: 'https://example.com/5', shortenedUrl: 'test5' },
    ]

    for (const create of creates) {
      const result = await createShortenedLink(create)
      if (!isRight(result)) {
        throw new Error(`Failed to create ${create.shortenedUrl}: ${unwrapEither(result).message}`)
      }
    }

    const result = await getShortenedLinks({
      pageSize: 2,
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(2)
    expect(data.total).toBe(5)
    expect(data.page).toBe(1)
    expect(data.pageSize).toBe(2)
    expect(data.totalPages).toBe(3)
  })

  it('should return correct page of results', async () => {
    // Create test data
    for (let i = 1; i <= 5; i++) {
      await createShortenedLink({
        url: `https://example.com/page/${i}`,
        shortenedUrl: `page-test${i}`,
      })
    }

    const result = await getShortenedLinks({
      page: 2,
      pageSize: 2,
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(2)
    expect(data.total).toBe(5)
    expect(data.page).toBe(2)
    expect(data.pageSize).toBe(2)
    expect(data.totalPages).toBe(3)
  })

  it('should filter by search query matching URL', async () => {
    await createShortenedLink({
      url: 'https://google.com',
      shortenedUrl: 'goog1',
    })
    await createShortenedLink({
      url: 'https://example.com',
      shortenedUrl: 'exam1',
    })
    await createShortenedLink({
      url: 'https://github.com',
      shortenedUrl: 'git1',
    })

    const result = await getShortenedLinks({
      searchQuery: 'google',
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(1)
    expect(data.shortenedLinks[0].url).toContain('google')
    expect(data.total).toBe(1)
  })

  it('should filter by search query matching shortened URL', async () => {
    await createShortenedLink({
      url: 'https://example.com/1',
      shortenedUrl: 'my-special-link',
    })
    await createShortenedLink({
      url: 'https://example.com/2',
      shortenedUrl: 'another-link',
    })
    await createShortenedLink({
      url: 'https://example.com/3',
      shortenedUrl: 'test-link',
    })

    const result = await getShortenedLinks({
      searchQuery: 'special',
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(1)
    expect(data.shortenedLinks[0].shortenedUrl).toContain('special')
    expect(data.total).toBe(1)
  })

  it('should search case-insensitively', async () => {
    await createShortenedLink({
      url: 'https://GitHub.com',
      shortenedUrl: 'GIT1',
    })

    const result = await getShortenedLinks({
      searchQuery: 'github',
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(1)
  })

  it('should sort by createdAt in descending order by default', async () => {
    await createShortenedLink({
      url: 'https://example.com/1',
      shortenedUrl: 'first',
    })
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10))
    await createShortenedLink({
      url: 'https://example.com/2',
      shortenedUrl: 'second',
    })
    await new Promise(resolve => setTimeout(resolve, 10))
    await createShortenedLink({
      url: 'https://example.com/3',
      shortenedUrl: 'third',
    })

    const result = await getShortenedLinks({})

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(3)
    // Should be sorted by createdAt DESC (newest first)
    expect(data.shortenedLinks[0].shortenedUrl).toBe('third')
    expect(data.shortenedLinks[2].shortenedUrl).toBe('first')
  })

  it('should sort by shortenedUrl in ascending order', async () => {
    await createShortenedLink({
      url: 'https://example.com/1',
      shortenedUrl: 'zebra',
    })
    await createShortenedLink({
      url: 'https://example.com/2',
      shortenedUrl: 'apple',
    })
    await createShortenedLink({
      url: 'https://example.com/3',
      shortenedUrl: 'monkey',
    })

    const result = await getShortenedLinks({
      sortBy: 'shortenedUrl',
      sortDirection: 'asc',
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(3)
    expect(data.shortenedLinks[0].shortenedUrl).toBe('apple')
    expect(data.shortenedLinks[1].shortenedUrl).toBe('monkey')
    expect(data.shortenedLinks[2].shortenedUrl).toBe('zebra')
  })

  it('should sort by url in descending order', async () => {
    await createShortenedLink({
      url: 'https://a-site.com',
      shortenedUrl: 'link1',
    })
    await createShortenedLink({
      url: 'https://z-site.com',
      shortenedUrl: 'link2',
    })
    await createShortenedLink({
      url: 'https://m-site.com',
      shortenedUrl: 'link3',
    })

    const result = await getShortenedLinks({
      sortBy: 'url',
      sortDirection: 'desc',
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(3)
    expect(data.shortenedLinks[0].url).toBe('https://z-site.com')
    expect(data.shortenedLinks[1].url).toBe('https://m-site.com')
    expect(data.shortenedLinks[2].url).toBe('https://a-site.com')
  })

  it('should return all required fields for each shortened link', async () => {
    await createShortenedLink({
      url: 'https://example.com',
      shortenedUrl: 'test123',
    })

    const result = await getShortenedLinks({})

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(1)

    const link = data.shortenedLinks[0]
    expect(link.id).toBeDefined()
    expect(typeof link.id).toBe('string')
    expect(link.url).toBe('https://example.com')
    expect(link.shortenedUrl).toBe('test123')
    expect(link.visits).toBe(0)
    expect(link.createdAt).toBeInstanceOf(Date)
    expect(link.updatedAt).toBeInstanceOf(Date)
  })

  it('should combine search and pagination', async () => {
    // Create links with searchable content
    for (let i = 1; i <= 5; i++) {
      await createShortenedLink({
        url: `https://example.com/${i}`,
        shortenedUrl: `example${i}`,
      })
    }
    await createShortenedLink({
      url: 'https://google.com',
      shortenedUrl: 'google1',
    })

    const result = await getShortenedLinks({
      searchQuery: 'example',
      page: 1,
      pageSize: 3,
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(3)
    expect(data.total).toBe(5)
    expect(data.totalPages).toBe(2)
    // All results should match the search query
    data.shortenedLinks.forEach(link => {
      expect(
        link.url.includes('example') || link.shortenedUrl.includes('example')
      ).toBe(true)
    })
  })

  it('should combine search, pagination, and sorting', async () => {
    await createShortenedLink({
      url: 'https://test.com/a',
      shortenedUrl: 'test-a',
    })
    await createShortenedLink({
      url: 'https://test.com/c',
      shortenedUrl: 'test-c',
    })
    await createShortenedLink({
      url: 'https://test.com/b',
      shortenedUrl: 'test-b',
    })
    await createShortenedLink({
      url: 'https://other.com',
      shortenedUrl: 'other',
    })

    const result = await getShortenedLinks({
      searchQuery: 'test',
      sortBy: 'shortenedUrl',
      sortDirection: 'asc',
      page: 1,
      pageSize: 2,
    })

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.shortenedLinks).toHaveLength(2)
    expect(data.total).toBe(3)
    expect(data.shortenedLinks[0].shortenedUrl).toBe('test-a')
    expect(data.shortenedLinks[1].shortenedUrl).toBe('test-b')
  })
})
