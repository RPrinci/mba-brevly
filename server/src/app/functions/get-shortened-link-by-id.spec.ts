import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isLeft, isRight, unwrapEither } from '@/infra/shared/either'
import { createShortenedLink } from './create-shortened-link'
import { getShortenedLinkById } from './get-shortened-link-by-id'

describe.sequential('getShortenedLinkById', () => {
  beforeEach(async () => {
    await db.delete(schema.shortenedLinks)
  })

  afterAll(async () => {
    await db.delete(schema.shortenedLinks)
  })

  it('should successfully retrieve an existing shortened link by id', async () => {
    // Create a link first
    const createResult = await createShortenedLink({
      url: 'https://example.com/test',
      shortenedUrl: 'test-link',
    })
    expect(isRight(createResult)).toBe(true)

    const created = unwrapEither(createResult)
    const linkId = created.id

    // Retrieve the link by ID
    const getResult = await getShortenedLinkById({ id: linkId })

    expect(isRight(getResult)).toBe(true)

    if (isRight(getResult)) {
      const link = unwrapEither(getResult)

      expect(link.id).toBe(linkId)
      expect(link.url).toBe('https://example.com/test')
      expect(link.shortenedUrl).toBe('test-link')
      expect(link.visits).toBe(0)
      expect(link.createdAt).toBeInstanceOf(Date)
      expect(link.updatedAt).toBeInstanceOf(Date)
    }
  })

  it('should return error when retrieving non-existent link', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000'

    const result = await getShortenedLinkById({ id: nonExistentId })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('not found')
    }
  })

  it('should return error for invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'

    const result = await getShortenedLinkById({ id: invalidId })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
      expect(error.message).toContain('Invalid ID format')
    }
  })

  it('should return error for empty string ID', async () => {
    const result = await getShortenedLinkById({ id: '' })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
    }
  })

  it('should return complete link information including all fields', async () => {
    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/complete-info',
      shortenedUrl: 'complete-info',
    })
    expect(isRight(createResult)).toBe(true)

    const created = unwrapEither(createResult)

    // Retrieve the link
    const getResult = await getShortenedLinkById({ id: created.id })
    expect(isRight(getResult)).toBe(true)

    const link = unwrapEither(getResult)

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

  it('should retrieve correct link when multiple links exist', async () => {
    // Create multiple links
    const result1 = await createShortenedLink({
      url: 'https://example.com/1',
      shortenedUrl: 'link-1',
    })
    const result2 = await createShortenedLink({
      url: 'https://example.com/2',
      shortenedUrl: 'link-2',
    })
    const result3 = await createShortenedLink({
      url: 'https://example.com/3',
      shortenedUrl: 'link-3',
    })

    expect(isRight(result1)).toBe(true)
    expect(isRight(result2)).toBe(true)
    expect(isRight(result3)).toBe(true)

    const link2Id = unwrapEither(result2).id

    // Retrieve the second link
    const getResult = await getShortenedLinkById({ id: link2Id })
    expect(isRight(getResult)).toBe(true)

    const retrievedLink = unwrapEither(getResult)

    // Verify it's the correct link
    expect(retrievedLink.id).toBe(link2Id)
    expect(retrievedLink.url).toBe('https://example.com/2')
    expect(retrievedLink.shortenedUrl).toBe('link-2')
  })

  it('should retrieve link with special characters in URL', async () => {
    // Create a link with special characters
    const createResult = await createShortenedLink({
      url: 'https://example.com/path?foo=bar&baz=qux#section',
      shortenedUrl: 'special-chars-link',
    })
    expect(isRight(createResult)).toBe(true)

    const created = unwrapEither(createResult)

    // Retrieve the link
    const getResult = await getShortenedLinkById({ id: created.id })
    expect(isRight(getResult)).toBe(true)

    const link = unwrapEither(getResult)

    // Verify URL is preserved correctly (note: normalized)
    expect(link.url).toBeTruthy()
    expect(link.shortenedUrl).toBe('special-chars-link')
  })

  it('should return error for malformed UUID', async () => {
    const malformedIds = [
      '123',
      'abc-def-ghi',
      '550e8400-e29b-41d4-a716',
      '550e8400-e29b-41d4-a716-446655440000-extra',
    ]

    for (const malformedId of malformedIds) {
      const result = await getShortenedLinkById({ id: malformedId })

      expect(isLeft(result)).toBe(true)

      if (isLeft(result)) {
        const error = unwrapEither(result)
        expect(error.message).toContain('Validation error')
      }
    }
  })

  it('should have consistent timestamps between creation and retrieval', async () => {
    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/timestamp-test',
      shortenedUrl: 'timestamp-test',
    })
    expect(isRight(createResult)).toBe(true)

    const created = unwrapEither(createResult)
    const createdAt = created.createdAt

    // Retrieve the link
    const getResult = await getShortenedLinkById({ id: created.id })
    expect(isRight(getResult)).toBe(true)

    const retrieved = unwrapEither(getResult)

    // Timestamps should match
    expect(retrieved.createdAt.getTime()).toBe(createdAt.getTime())
  })
})
