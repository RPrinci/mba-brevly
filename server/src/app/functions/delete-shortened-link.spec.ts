import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isLeft, isRight, unwrapEither } from '@/infra/shared/either'
import { createShortenedLink } from './create-shortened-link'
import { deleteShortenedLink } from './delete-shortened-link'

describe.sequential('deleteShortenedLink', () => {
  beforeEach(async () => {
    await db.delete(schema.shortenedLinks)
  })

  afterAll(async () => {
    await db.delete(schema.shortenedLinks)
  })

  it('should successfully delete an existing shortened link', async () => {
    // Create a link first
    const createResult = await createShortenedLink({
      url: 'https://example.com',
      shortenedUrl: 'test123',
    })
    expect(isRight(createResult)).toBe(true)

    const created = unwrapEither(createResult)
    const linkId = created.id

    // Delete the link
    const deleteResult = await deleteShortenedLink({ id: linkId })

    expect(isRight(deleteResult)).toBe(true)

    // Verify the link no longer exists
    const links = await db.query.shortenedLinks.findMany()
    expect(links).toHaveLength(0)
  })

  it('should return error when deleting non-existent link', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000'

    const result = await deleteShortenedLink({ id: nonExistentId })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('not found')
    }
  })

  it('should return error for invalid UUID format', async () => {
    const invalidId = 'not-a-valid-uuid'

    const result = await deleteShortenedLink({ id: invalidId })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
      expect(error.message).toContain('Invalid ID format')
    }
  })

  it('should return error for empty string ID', async () => {
    const result = await deleteShortenedLink({ id: '' })

    expect(isLeft(result)).toBe(true)

    if (isLeft(result)) {
      const error = unwrapEither(result)
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Validation error')
    }
  })

  it('should only delete the specified link and not affect others', async () => {
    // Create multiple links
    const result1 = await createShortenedLink({
      url: 'https://example.com/1',
      shortenedUrl: 'link1',
    })
    const result2 = await createShortenedLink({
      url: 'https://example.com/2',
      shortenedUrl: 'link2',
    })
    const result3 = await createShortenedLink({
      url: 'https://example.com/3',
      shortenedUrl: 'link3',
    })

    expect(isRight(result1)).toBe(true)
    expect(isRight(result2)).toBe(true)
    expect(isRight(result3)).toBe(true)

    const link2Id = unwrapEither(result2).id

    // Delete only the second link
    const deleteResult = await deleteShortenedLink({ id: link2Id })
    expect(isRight(deleteResult)).toBe(true)

    // Verify only 2 links remain
    const remainingLinks = await db.query.shortenedLinks.findMany()
    expect(remainingLinks).toHaveLength(2)

    // Verify the correct links remain
    const remainingShortenedUrls = remainingLinks.map(link => link.shortenedUrl)
    expect(remainingShortenedUrls).toContain('link1')
    expect(remainingShortenedUrls).toContain('link3')
    expect(remainingShortenedUrls).not.toContain('link2')
  })

  it('should handle deleting the same link twice', async () => {
    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com',
      shortenedUrl: 'test-double-delete',
    })
    expect(isRight(createResult)).toBe(true)

    const linkId = unwrapEither(createResult).id

    // Delete the link first time
    const firstDelete = await deleteShortenedLink({ id: linkId })
    expect(isRight(firstDelete)).toBe(true)

    // Try to delete again
    const secondDelete = await deleteShortenedLink({ id: linkId })
    expect(isLeft(secondDelete)).toBe(true)

    if (isLeft(secondDelete)) {
      const error = unwrapEither(secondDelete)
      expect(error.message).toContain('not found')
    }
  })

  it('should successfully delete link with special characters in URL', async () => {
    // Create a link with special characters
    const createResult = await createShortenedLink({
      url: 'https://example.com/path?foo=bar&baz=qux#section',
      shortenedUrl: 'special-chars',
    })
    expect(isRight(createResult)).toBe(true)

    const linkId = unwrapEither(createResult).id

    // Delete the link
    const deleteResult = await deleteShortenedLink({ id: linkId })
    expect(isRight(deleteResult)).toBe(true)

    // Verify deletion
    const links = await db.query.shortenedLinks.findMany()
    expect(links).toHaveLength(0)
  })

  it('should return error for malformed UUID', async () => {
    const malformedIds = [
      '123',
      'abc-def-ghi',
      '550e8400-e29b-41d4-a716',
      '550e8400-e29b-41d4-a716-446655440000-extra',
    ]

    for (const malformedId of malformedIds) {
      const result = await deleteShortenedLink({ id: malformedId })

      expect(isLeft(result)).toBe(true)

      if (isLeft(result)) {
        const error = unwrapEither(result)
        expect(error.message).toContain('Validation error')
      }
    }
  })
})
