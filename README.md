# Brev.ly

A modern, full-stack URL shortening service that transforms long URLs into short, memorable links with visit tracking, analytics, and a beautiful user interface.

## 🚀 Overview

Brev.ly is a complete URL shortening platform consisting of:

- **Backend API** (`/server`) - RESTful API built with Fastify, TypeScript, and PostgreSQL
- **Frontend Web App** (`/web`) - Modern React application with Tailwind CSS

The platform allows users to create shortened links, track visits, manage their links, and export data in CSV format. All URLs are validated for accessibility before being served, ensuring a reliable user experience.

## ✨ Features

### Core Functionality

- **URL Shortening**: Transform long URLs into short, memorable identifiers
- **Custom Short Codes**: Users can specify their own shortened URL identifiers
- **Visit Tracking**: Automatic tracking and incrementing of link visits
- **URL Validation**: Validates target URLs are accessible before serving
- **URL Normalization**: Automatically normalizes URLs (removes trailing slashes, sorts query parameters) to prevent duplicates

### Management Features

- **Link Management**: View, search, sort, and delete shortened links
- **Pagination**: Efficient pagination for large link collections
- **Search & Filter**: Search links by URL or shortened URL identifier
- **CSV Export**: Download all link data in CSV format
- **Real-time Updates**: Visit counts update in real-time without page refresh

### Developer Experience

- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Comprehensive Testing**: 67+ backend tests with Vitest
- **Error Handling**: Functional error handling using Either monad pattern
- **Docker Support**: PostgreSQL database setup via Docker Compose

## 🏗️ Architecture

### Project Structure

```
brevly/
├── server/                 # Backend API
│   ├── src/
│   │   ├── app/
│   │   │   └── functions/  # Business logic functions
│   │   ├── infra/
│   │   │   ├── db/         # Database configuration & schemas
│   │   │   ├── http/       # HTTP layer (Fastify routes)
│   │   │   └── shared/     # Shared utilities (Either monad)
│   │   └── env.ts          # Environment configuration
│   ├── docker/             # Docker initialization scripts
│   ├── docker-compose.yml  # PostgreSQL container setup
│   └── package.json
│
└── web/                    # Frontend application
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Page components (Home, Redirect)
    │   ├── services/       # API client
    │   └── app.tsx         # Main app with routing
    ├── public/             # Static assets
    └── package.json
```

## 🛠️ Tech Stack

### Backend (`/server`)

- **Runtime**: Node.js v22+
- **Framework**: [Fastify](https://fastify.dev/) - High-performance web framework
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/) - TypeScript-first schema validation
- **Testing**: [Vitest](https://vitest.dev/) - Fast unit test framework
- **Code Quality**: [Biome](https://biomejs.dev/) - Fast formatter and linter
- **API Docs**: Swagger/OpenAPI with Fastify Swagger UI

### Frontend (`/web`)

- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 3
- **Routing**: React Router DOM 7.11.0
- **HTTP Client**: Axios 1.13.2
- **Icons**: Phosphor Icons 2.1.10

## 📋 Prerequisites

- **Node.js** >= 22.0.0
- **pnpm** (recommended) or npm/yarn
- **PostgreSQL** (or use Docker Compose)
- **Docker** (optional, for database setup)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd brevly
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
pnpm install

# Set up environment variables
# Create a .env file:
DATABASE_URL=postgresql://docker:docker@localhost:5432/brevly

# For testing, create .env.test:
DATABASE_URL=postgresql://docker:docker@localhost:5432/brevly_test
```

#### Option A: Use Docker Compose (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d

# Push database schema
pnpm run db:push
```

#### Option B: Use Existing PostgreSQL

Ensure PostgreSQL is running and update `DATABASE_URL` in `.env` accordingly.

#### Start the Backend Server

```bash
pnpm run dev
```

The API will be available at `http://localhost:3333`
API documentation: `http://localhost:3333/docs`

### 3. Frontend Setup

```bash
cd web

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The frontend will be available at `http://localhost:5173`

## 📚 Available Scripts

### Backend (`/server`)

| Script                 | Description                              |
| ---------------------- | ---------------------------------------- |
| `pnpm run dev`         | Start development server with hot reload |
| `pnpm run test`        | Run all tests                            |
| `pnpm run test:watch`  | Run tests in watch mode                  |
| `pnpm run db:generate` | Generate database migrations             |
| `pnpm run db:migrate`  | Run database migrations                  |
| `pnpm run db:push`     | Push schema changes to database          |
| `pnpm run db:studio`   | Open Drizzle Studio (database GUI)       |
| `pnpm run build`       | Build for production                     |

### Frontend (`/web`)

| Script         | Description              |
| -------------- | ------------------------ |
| `pnpm dev`     | Start development server |
| `pnpm build`   | Build for production     |
| `pnpm preview` | Preview production build |
| `pnpm lint`    | Run ESLint               |

## 🔌 API Endpoints

### Create Shortened Link

```http
POST /shortened-links
Content-Type: application/json

{
  "url": "https://example.com/very/long/url",
  "shortenedUrl": "my-link"
}
```

### List Shortened Links

```http
GET /shortened-links?searchQuery=example&sortBy=createdAt&sortDirection=desc&page=1&pageSize=20
```

### Get Original URL (Increments Visit Count)

```http
GET /shortened-links/shortened/:shortenedUrl
```

### Get Shortened Link by ID

```http
GET /shortened-links/:id
```

### Delete Shortened Link

```http
DELETE /shortened-links/:id
```

### Export to CSV

```http
GET /shortened-links/export/csv
```

For complete API documentation, visit `http://localhost:3333/docs` when the server is running.

## 🗄️ Database Schema

### `shortened_links` Table

| Column          | Type                     | Constraints             |
| --------------- | ------------------------ | ----------------------- |
| `id`            | TEXT                     | PRIMARY KEY, UUID       |
| `url`           | TEXT                     | NOT NULL                |
| `shortened_url` | TEXT                     | NOT NULL, UNIQUE        |
| `visits`        | INTEGER                  | NOT NULL, DEFAULT 0     |
| `created_at`    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() |
| `updated_at`    | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() |

## 🎨 Frontend Features

### Design System

- **Color Palette**: Blue-based primary colors with gray scale
- **Typography**: Open Sans font family
- **Components**: Custom buttons, inputs, scrollbars, and loading indicators
- **Responsive**: Mobile-first design that works on all screen sizes

### User Experience

- **Real-time Updates**: Visit counts update automatically
- **Loading States**: Animated progress bars and loading indicators
- **Error Handling**: User-friendly error messages
- **404 Pages**: Custom 404 page for invalid links
- **Redirect Flow**: Smooth redirect experience with 2-second loading animation

## 🧪 Testing

### Backend Tests

```bash
cd server
pnpm run test
```

- **67+ tests** covering all business logic
- **Integration tests** with real database connections
- **Mocked external dependencies** (URL validation)
- **Sequential test execution** to prevent race conditions

## 🏭 Production Deployment

### Backend

1. Build the application:

```bash
cd server
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

### Frontend

1. Build for production:

```bash
cd web
pnpm build
```

2. Serve the `dist` folder using a web server (Nginx, Apache, etc.)

### Recommended Production Setup

- Use a connection pooler (e.g., PgBouncer) for PostgreSQL
- Set up proper environment variable management
- Configure rate limiting for public-facing endpoints
- Set up monitoring and logging (e.g., Sentry, DataDog)
- Use a reverse proxy (e.g., Nginx) for SSL termination
- Configure CORS to restrict origins in production

## 🏛️ Architecture Patterns

### Either Monad Pattern

The backend uses functional error handling with the Either monad pattern:

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

### URL Normalization

URLs are automatically normalized for consistency:

- Trailing slashes removed (except root `/`)
- Query parameters sorted alphabetically
- Prevents duplicate entries for equivalent URLs

### URL Validation

Before serving shortened links, the system validates that target URLs are accessible using HTTP HEAD/GET requests with a 5-second timeout.

## 📝 Environment Variables

### Backend (`/server`)

| Variable       | Description                  | Required |
| -------------- | ---------------------------- | -------- |
| `DATABASE_URL` | PostgreSQL connection string | Yes      |

### Frontend (`/web`)

The frontend API base URL is configured in `src/services/api.ts`. Update it for production:

```typescript
export const api = axios.create({
  baseURL: "https://api.brevly.com", // Production API URL
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run tests: `pnpm run test` (backend) or `pnpm lint` (frontend)
5. Commit your changes: `git commit -m "Add my feature"`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

## 📄 License

MIT

## 👤 Author

**Ronnie Princi**

- Email: ronnie@creartech.com

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.

---

Built with ❤️ using TypeScript, React, Fastify, and PostgreSQL
