# Brev.ly Server

A URL shortening service built with Fastify, TypeScript, and PostgreSQL. This backend provides a REST API for creating, managing, and accessing shortened URLs with visit tracking and analytics.

## Features

- **Create Shortened Links**: Generate short, memorable URLs with custom identifiers
- **URL Validation**: Automatic validation that target URLs are accessible before serving
- **Visit Tracking**: Automatically track and increment visit counts
- **Search & Filter**: Search shortened links by URL or identifier with pagination and sorting
- **CSV Export**: Download complete link data in CSV format
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Comprehensive Testing**: 67+ tests with Vitest

## Tech Stack

- **Runtime**: Node.js v22+
- **Framework**: [Fastify](https://fastify.dev/) - Fast and low overhead web framework
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/) - TypeScript-first schema validation
- **Testing**: [Vitest](https://vitest.dev/) - Fast unit test framework
- **Code Quality**: [Biome](https://biomejs.dev/) - Fast formatter and linter

## Prerequisites

- Node.js >= 22.0.0
- pnpm (recommended) or npm
- PostgreSQL database

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd server
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/brevly
```

Create a `.env.test` file for testing:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/brevly_test
```

4. Push database schema:

```bash
pnpm run db:push
```

## Development

Start the development server:

```bash
pnpm run dev
```

The server will start at `http://localhost:3333`

### Available Scripts

- `pnpm run dev` - Start development server with hot reload
- `pnpm run test` - Run all tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run db:generate` - Generate database migrations
- `pnpm run db:migrate` - Run database migrations
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:studio` - Open Drizzle Studio (database GUI)
- `pnpm run build` - Build for production

## API Documentation

Interactive API documentation is available at `http://localhost:3333/docs` when the server is running.

### API Endpoints

#### Create Shortened Link

```http
POST /shortened-links
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "shortenedUrl": "my-link"
}
```

**Response (201)**:

```json
{
  "id": "uuid",
  "url": "https://example.com/very/long/url",
  "shortenedUrl": "my-link",
  "createdAt": "2025-12-31T12:00:00.000Z"
}
```

#### List Shortened Links

```http
GET /shortened-links?searchQuery=example&sortBy=createdAt&sortDirection=desc&page=1&pageSize=20
```

**Query Parameters**:

- `searchQuery` (optional) - Search by URL or shortened URL
- `sortBy` (optional) - Sort field: `createdAt`, `url`, `shortenedUrl`, `visits`
- `sortDirection` (optional) - `asc` or `desc`
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 20)

**Response (200)**:

```json
{
  "shortenedLinks": [
    {
      "id": "uuid",
      "url": "https://example.com/very/long/url",
      "shortenedUrl": "my-link",
      "visits": 42,
      "createdAt": "2025-12-31T12:00:00.000Z",
      "updatedAt": "2025-12-31T13:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

#### Get Original URL by Shortened URL

```http
GET /shortened-links/shortened/:shortenedUrl
```

This endpoint:

- Validates the target URL is accessible
- Increments the visit count
- Returns the original URL and link information

**Response (200)**:

```json
{
  "id": "uuid",
  "url": "https://example.com/very/long/url",
  "shortenedUrl": "my-link",
  "visits": 43,
  "createdAt": "2025-12-31T12:00:00.000Z",
  "updatedAt": "2025-12-31T13:01:00.000Z"
}
```

**Response (404)**: Shortened link not found or target URL is not accessible

#### Get Shortened Link by ID

```http
GET /shortened-links/:id
```

**Response (200)**:

```json
{
  "id": "uuid",
  "url": "https://example.com/very/long/url",
  "shortenedUrl": "my-link",
  "visits": 42,
  "createdAt": "2025-12-31T12:00:00.000Z",
  "updatedAt": "2025-12-31T13:00:00.000Z"
}
```

#### Export to CSV

```http
GET /shortened-links/export/csv
```

Downloads a CSV file with all shortened links including ID, URL, shortened URL, visit count, and timestamps.

#### Delete Shortened Link

```http
DELETE /shortened-links/:id
```

**Response (204)**: Successfully deleted (no content)

### Error Responses

All endpoints return consistent error responses:

**400 Bad Request**:

```json
{
  "message": "Validation error: Invalid URL format"
}
```

**404 Not Found**:

```json
{
  "message": "Shortened link not found"
}
```

**409 Conflict**:

```json
{
  "message": "Shortened URL already exists"
}
```

**500 Internal Server Error**:

```json
{
  "message": "An unexpected error occurred"
}
```

## Architecture

### Project Structure

```
src/
├── app/
│   └── functions/          # Business logic functions
│       ├── create-shortened-link.ts
│       ├── get-shortened-links.ts
│       ├── get-shortened-link-by-id.ts
│       ├── get-shortened-link-by-shortened-url.ts
│       ├── delete-shortened-link.ts
│       ├── export-shortened-links-csv.ts
│       └── *.spec.ts       # Test files
├── infra/
│   ├── db/                 # Database configuration
│   │   └── schemas/        # Drizzle ORM schemas
│   ├── http/               # HTTP layer
│   │   ├── routes/         # Route handlers
│   │   └── server.ts       # Fastify server setup
│   └── shared/             # Shared utilities
│       └── either.ts       # Either monad for error handling
```

### Design Patterns

**Either Monad Pattern**: All business logic functions return `Either<Error, SuccessType>` for functional error handling:

```typescript
const result = await createShortenedLink({ url, shortenedUrl });

if (isLeft(result)) {
  const error = unwrapEither(result);
  // Handle error
} else {
  const data = unwrapEither(result);
  // Handle success
}
```

**URL Normalization**: URLs are automatically normalized for consistency:

- Trailing slashes removed (except root `/`)
- Query parameters sorted alphabetically
- Prevents duplicate entries for equivalent URLs

**URL Validation**: Before serving shortened links, the system validates that target URLs are accessible using HTTP HEAD/GET requests with a 5-second timeout.

## Database Schema

### shortened_links table

| Column        | Type                     | Constraints             |
| ------------- | ------------------------ | ----------------------- |
| id            | TEXT                     | PRIMARY KEY, UUID       |
| url           | TEXT                     | NOT NULL                |
| shortened_url | TEXT                     | NOT NULL, UNIQUE        |
| visits        | INTEGER                  | NOT NULL, DEFAULT 0     |
| created_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() |
| updated_at    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() |

## Testing

Run the test suite:

```bash
pnpm run test
```

Run tests in watch mode:

```bash
pnpm run test:watch
```

### Test Coverage

- **67 tests** covering all business logic
- **Integration tests** with real database connections
- **Mocked external dependencies** (URL validation via fetch)
- **Sequential test execution** to prevent race conditions

Test files follow the naming convention: `*.spec.ts`

## CORS Configuration

The server is configured to accept requests from any origin with the following methods:

- GET
- POST
- PUT
- PATCH
- DELETE
- OPTIONS

To restrict CORS in production, modify the configuration in `src/infra/http/server.ts`:

```typescript
server.register(fastifyCors, {
  origin: "https://your-frontend-domain.com",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});
```

## Environment Variables

| Variable     | Description                  | Required |
| ------------ | ---------------------------- | -------- |
| DATABASE_URL | PostgreSQL connection string | Yes      |

## Production Deployment

1. Build the application:

```bash
pnpm run build
```

2. Set production environment variables

3. Run database migrations:

```bash
pnpm run db:migrate
```

4. Start the server:

```bash
node dist/index.js
```

### Recommended Production Setup

- Use a connection pooler (e.g., PgBouncer) for PostgreSQL
- Set up proper environment variable management (e.g., Docker secrets, AWS Parameter Store)
- Configure rate limiting for public-facing endpoints
- Set up monitoring and logging (e.g., Sentry, DataDog)
- Use a reverse proxy (e.g., Nginx) for SSL termination

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run tests: `pnpm run test`
5. Commit your changes: `git commit -m "Add my feature"`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
