import { eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isLeft, isRight, unwrapEither } from '@/infra/shared/either'
import { createShortenedLink } from './create-shortened-link'

describe.sequential('createShortenedLink', () => {
  beforeEach(async () => {
    await db.delete(schema.shortenedLinks)
  })

  afterAll(async () => {
    await db.delete(schema.shortenedLinks)
  })

  it('should create a shortened link with valid input', async () => {
    const input = {
      url: 'https://www.google.com',
      shortenedUrl: 'google123',
    }

    const result = await createShortenedLink(input)

    expect(isRight(result)).toBe(true)

    if (isRight(result)) {
      const output = unwrapEither(result)

      expect(output).toMatchObject({
        url: 'https://www.google.com',
        shortenedUrl: 'google123',
      })
      expect(output.id).toBeDefined()
      expect(output.createdAt).toBeInstanceOf(Date)
    }

    const shortenedLink = await db.query.shortenedLinks.findFirst({
      where: eq(schema.shortenedLinks.shortenedUrl, input.shortenedUrl),
    })

    expect(shortenedLink).toBeDefined()
    expect(shortenedLink?.url).toBe('https://www.google.com')
    expect(shortenedLink?.shortenedUrl).toBe('google123')
  })

  it('should normalize URLs by removing trailing slashes', async () => {
    const input = {
      url: 'https://www.example.com/path/',
      shortenedUrl: 'example1',
    }

    const result = await createShortenedLink(input)

    expect(isRight(result)).toBe(true)

    if (isRight(result)) {
      const output = unwrapEither(result)
      expect(output.url).toBe('https://www.example.com/path')
    }
  })

  it('should normalize URLs by sorting query parameters', async () => {
    const input = {
      url: 'https://www.example.com?z=1&a=2&m=3',
      shortenedUrl: 'example2',
    }

    const result = await createShortenedLink(input)

    expect(isRight(result)).toBe(true)

    if (isRight(result)) {
      const output = unwrapEither(result)
      expect(output.url).toBe('https://www.example.com/?a=2&m=3&z=1')
    }
  })

  it('should return error for invalid URL format', async () => {
    const input = {
      url: 'not-a-valid-url',
      shortenedUrl: 'test123',
    }

    const result = await createShortenedLink(input)

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
      expect(error.message).toContain('Invalid URL')
    }
  })

  it('should return error for URL exceeding max length', async () => {
    const longUrl = `https://example.com/${'a'.repeat(2050)}`
    const input = {
      url: longUrl,
      shortenedUrl: 'test456',
    }

    const result = await createShortenedLink(input)

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
    }
  })

  it('should return error for empty shortened URL', async () => {
    const input = {
      url: 'https://www.google.com',
      shortenedUrl: '',
    }

    const result = await createShortenedLink(input)

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
    }
  })

  it('should return error for shortened URL exceeding max length', async () => {
    const input = {
      url: 'https://www.google.com',
      shortenedUrl: 'a'.repeat(51),
    }

    const result = await createShortenedLink(input)

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
    }
  })

  it('should return error for shortened URL with invalid characters', async () => {
    const input = {
      url: 'https://www.google.com',
      shortenedUrl: 'test@123!',
    }

    const result = await createShortenedLink(input)

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
      expect(error.message).toContain('alphanumeric')
    }
  })

  it('should accept shortened URL with hyphens and underscores', async () => {
    const input = {
      url: 'https://www.example.com',
      shortenedUrl: 'test-url_123',
    }

    const result = await createShortenedLink(input)

    expect(isRight(result)).toBe(true)

    if (isRight(result)) {
      const output = unwrapEither(result)
      expect(output.shortenedUrl).toBe('test-url_123')
    }
  })

  it('should return error for duplicate shortened URL', async () => {
    const input = {
      url: 'https://www.google.com',
      shortenedUrl: 'duplicate123',
    }

    // Create first link
    const firstResult = await createShortenedLink(input)
    expect(isRight(firstResult)).toBe(true)

    // Try to create duplicate
    const secondResult = await createShortenedLink(input)

    expect(isLeft(secondResult)).toBe(true)

    if (isLeft(secondResult)) {
      const error = unwrapEither(secondResult)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('already exists')
    }
  })

  it('should allow same URL with different shortened URLs', async () => {
    const url = 'https://www.example.com'

    const firstResult = await createShortenedLink({
      url,
      shortenedUrl: 'short1',
    })

    const secondResult = await createShortenedLink({
      url,
      shortenedUrl: 'short2',
    })

    expect(isRight(firstResult)).toBe(true)
    expect(isRight(secondResult)).toBe(true)
  })
})
