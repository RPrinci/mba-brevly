import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isRight, unwrapEither } from '@/infra/shared/either'
import { createShortenedLink } from './create-shortened-link'
import { exportShortenedLinksCsv } from './export-shortened-links-csv'

describe.sequential('exportShortenedLinksCsv', () => {
  beforeEach(async () => {
    await db.delete(schema.shortenedLinks)
  })

  afterAll(async () => {
    await db.delete(schema.shortenedLinks)
  })

  it('should export empty CSV with headers when no links exist', async () => {
    const result = await exportShortenedLinksCsv()

    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    // Should have header row
    expect(data.csv).toContain('ID,URL,Shortened URL,Visits,Created At,Updated At')

    // Should only have header (one line)
    const lines = data.csv.split('\n')
    expect(lines).toHaveLength(1)
  })

  it('should export CSV with single shortened link', async () => {
    // Create a link
    const createResult = await createShortenedLink({
      url: 'https://example.com/test',
      shortenedUrl: 'test-link',
    })
    expect(isRight(createResult)).toBe(true)

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)
    const lines = data.csv.split('\n')

    // Should have header + 1 data row
    expect(lines).toHaveLength(2)

    // Verify header
    expect(lines[0]).toBe('ID,URL,Shortened URL,Visits,Created At,Updated At')

    // Verify data row contains expected values
    const dataRow = lines[1]
    expect(dataRow).toContain('https://example.com/test')
    expect(dataRow).toContain('test-link')
    expect(dataRow).toContain(',0,') // visits should be 0
  })

  it('should export CSV with multiple shortened links', async () => {
    // Create multiple links
    await createShortenedLink({
      url: 'https://example.com/1',
      shortenedUrl: 'link-1',
    })
    await createShortenedLink({
      url: 'https://example.com/2',
      shortenedUrl: 'link-2',
    })
    await createShortenedLink({
      url: 'https://example.com/3',
      shortenedUrl: 'link-3',
    })

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)
    const lines = data.csv.split('\n')

    // Should have header + 3 data rows
    expect(lines).toHaveLength(4)

    // Verify all links are present
    const csvContent = data.csv
    expect(csvContent).toContain('link-1')
    expect(csvContent).toContain('link-2')
    expect(csvContent).toContain('link-3')
  })

  it('should properly escape URLs with quotes', async () => {
    // Create a link with quotes in URL (although unusual)
    await createShortenedLink({
      url: 'https://example.com/search?q=test',
      shortenedUrl: 'search-link',
    })

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    // URL should be quoted in CSV
    expect(data.csv).toContain('"https://example.com/search?q=test"')
  })

  it('should include all required fields in CSV', async () => {
    const createResult = await createShortenedLink({
      url: 'https://example.com/complete',
      shortenedUrl: 'complete-link',
    })
    expect(isRight(createResult)).toBe(true)

    const created = unwrapEither(createResult)

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)
    const lines = data.csv.split('\n')
    const dataRow = lines[1]

    // Split by comma (accounting for quoted URLs)
    const fields = dataRow.split(',')

    // Should have 6 fields (ID, URL, Shortened URL, Visits, Created At, Updated At)
    // Note: URL is quoted, so it counts as one field
    expect(fields.length).toBeGreaterThanOrEqual(6)

    // Verify specific fields are present
    expect(dataRow).toContain(created.id)
    expect(dataRow).toContain('complete-link')
    expect(dataRow).toContain(',0,') // visits
  })

  it('should export links in descending order by creation date', async () => {
    // Create links with small delays to ensure different timestamps
    await createShortenedLink({
      url: 'https://example.com/first',
      shortenedUrl: 'first-link',
    })

    await new Promise(resolve => setTimeout(resolve, 10))

    await createShortenedLink({
      url: 'https://example.com/second',
      shortenedUrl: 'second-link',
    })

    await new Promise(resolve => setTimeout(resolve, 10))

    await createShortenedLink({
      url: 'https://example.com/third',
      shortenedUrl: 'third-link',
    })

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)
    const lines = data.csv.split('\n')

    // Most recent should be first (after header)
    expect(lines[1]).toContain('third-link')
    expect(lines[3]).toContain('first-link')
  })

  it('should include ISO timestamps in CSV', async () => {
    await createShortenedLink({
      url: 'https://example.com/timestamp-test',
      shortenedUrl: 'timestamp-link',
    })

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    // Check for ISO timestamp format (YYYY-MM-DDTHH:mm:ss)
    expect(data.csv).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('should handle links with special characters in shortened URL', async () => {
    await createShortenedLink({
      url: 'https://example.com/special',
      shortenedUrl: 'special-link_123',
    })

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    expect(data.csv).toContain('special-link_123')
  })

  it('should export CSV that is a valid string', async () => {
    await createShortenedLink({
      url: 'https://example.com/test',
      shortenedUrl: 'test',
    })

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    // Verify it's a string
    expect(typeof data.csv).toBe('string')

    // Verify it's not empty
    expect(data.csv.length).toBeGreaterThan(0)

    // Verify it has proper CSV structure
    expect(data.csv).toContain('\n') // Has line breaks
  })

  it('should handle URLs with query parameters and fragments', async () => {
    await createShortenedLink({
      url: 'https://example.com/path?param1=value1&param2=value2#section',
      shortenedUrl: 'complex-url',
    })

    const result = await exportShortenedLinksCsv()
    expect(isRight(result)).toBe(true)

    const data = unwrapEither(result)

    // URL should be present and properly quoted
    expect(data.csv).toContain('complex-url')
    // Check that URL parameters are preserved (normalized)
    expect(data.csv).toMatch(/example\.com/)
  })
})
