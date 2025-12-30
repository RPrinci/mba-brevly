import { randomUUID } from 'node:crypto'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const shortenedLinks = pgTable('shortened_links', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  url: text('url').notNull(),
  shortenedUrl: text('shortened_url').notNull().unique(),
  visits: integer('visits').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
