import { db } from '@/infra/db'
import { type Either, makeRight } from '@/infra/shared/either'

type ExportShortenedLinksCsvOutput = {
  csv: string
}

export async function exportShortenedLinksCsv(): Promise<
  Either<never, ExportShortenedLinksCsvOutput>
> {
  // Fetch all shortened links from the database
  const shortenedLinks = await db.query.shortenedLinks.findMany({
    orderBy: (shortenedLinks, { desc }) => [desc(shortenedLinks.createdAt)],
  })

  // Create CSV header
  const headers = ['ID', 'URL', 'Shortened URL', 'Visits', 'Created At', 'Updated At']
  const csvHeader = headers.join(',')

  // Create CSV rows
  const csvRows = shortenedLinks.map(link => {
    const row = [
      link.id,
      `"${link.url.replace(/"/g, '""')}"`, // Escape quotes in URL
      link.shortenedUrl,
      link.visits.toString(),
      link.createdAt.toISOString(),
      link.updatedAt.toISOString(),
    ]
    return row.join(',')
  })

  // Combine header and rows
  const csv = [csvHeader, ...csvRows].join('\n')

  return makeRight({ csv })
}
