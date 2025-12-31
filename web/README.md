# Brev.ly - Frontend

A modern, responsive URL shortener web application built with React, TypeScript, and Tailwind CSS.

## Overview

Brev.ly is a clean and intuitive URL shortening service that allows users to create, manage, and track shortened links. The frontend provides a seamless user experience with real-time updates, beautiful animations, and a responsive design that works across all devices.

## Features

- **Create Shortened Links**: Transform long URLs into short, memorable links
- **Link Management**: View, copy, and delete your shortened links
- **Visit Tracking**: Real-time visit count updates without page refresh
- **CSV Export**: Download all your links data in CSV format
- **URL Validation**: Client and server-side validation for link accessibility
- **Responsive Design**: Optimized for desktop and mobile devices
- **Loading States**: Animated progress bar and loading indicators
- **Error Handling**: User-friendly error messages and 404 pages

## Tech Stack

- **React 19.2.0** - UI library
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router DOM 7.11.0** - Client-side routing
- **Axios 1.13.2** - HTTP client
- **Phosphor Icons 2.1.10** - Icon library

## Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (or npm/yarn)
- Backend API running at `http://localhost:3333`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd brevly/web
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Project Structure

```
web/
├── public/              # Static assets
│   ├── Logo.svg        # Application logo
│   └── 404.svg         # 404 error illustration
├── src/
│   ├── components/     # React components
│   │   ├── shortner-add.tsx
│   │   ├── shortner-add-body.tsx
│   │   ├── shortner-list.tsx
│   │   ├── shortner-list-body.tsx
│   │   └── shortner-list-link.tsx
│   ├── pages/          # Page components
│   │   ├── home.tsx
│   │   └── redirect.tsx
│   ├── services/       # API services
│   │   └── api.ts
│   ├── app.tsx         # Main app component with routing
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles and Tailwind config
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Design System

### Colors

- **Blue Base**: `#2C4481` - Links, accents
- **Blue Dark**: `#2C4091` - Primary buttons, hover states
- **Gray Scale**:
  - `#F9F9FB` (100)
  - `#E0E2E9` (200) - Background
  - `#CDCFD5` (300)
  - `#74798B` (400) - Labels, secondary text
  - `#4D506C` (500)
  - `#1F2025` (600) - Primary text
- **Danger**: `#B12C4D` - Error states

### Typography

- **Font Family**: Open Sans
- **Font Weights**: 400 (Regular), 600 (Semibold), 700 (Bold)

### Components

- **Buttons**: Primary, Secondary, Icon buttons with hover states
- **Inputs**: Text inputs with focus states and error handling
- **Custom Scrollbar**: 3px blue scrollbar for lists
- **Progress Bar**: Animated 3px loading indicator

## Key Features Implementation

### Link Creation

1. User enters original URL and desired shortened URL
2. Client-side validation ensures URL format and shortened URL pattern
3. Form submits to backend API
4. On success, list refreshes automatically
5. Duplicate shortened URLs return 409 error with user-friendly message

### Visit Tracking

- Visits increment automatically when:
  - User clicks link in the list
  - User accesses the redirect page
- Visit count updates in real-time without page refresh
- Backend validates URL accessibility before incrementing

### Redirect Flow

1. User accesses `/:shortCode` or `/r/:shortCode`
2. Frontend calls backend to validate and get original URL
3. Shows loading animation for 2 seconds
4. Redirects to original URL
5. If link doesn't exist or URL is invalid, shows 404 page

### CSV Export

- Exports all links with ID, URL, shortened URL, visits, and timestamps
- Filename includes current date: `brevly-links-YYYY-MM-DD.csv`
- Button disabled when no links exist or export in progress

## API Integration

The frontend communicates with a backend API at `http://localhost:3333`. API endpoints:

- `GET /shortened-links` - List all shortened links with pagination
- `POST /shortened-links` - Create new shortened link
- `GET /shortened-links/:id` - Get link by ID
- `DELETE /shortened-links/:id` - Delete link
- `GET /shortened-links/shortened/:shortenedUrl` - Get original URL and increment visits
- `GET /shortened-links/export/csv` - Export links to CSV

## Responsive Design

- **Mobile**: Centered logo, stacked components
- **Desktop**: Left-aligned logo, side-by-side layout
- **Scrollable List**: Max height 500px with custom scrollbar
- **Touch-friendly**: Adequate button sizes and spacing

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Custom scrollbar styling uses WebKit prefixes and is fully supported in modern browsers.

## Development Notes

- All components use TypeScript for type safety
- Tailwind CSS for styling with custom design system
- React hooks for state management
- Axios for API calls with error handling
- Form validation on both client and server side

## Contributing

1. Follow the existing code style
2. Use TypeScript types for all props and state
3. Follow the design system colors and spacing
4. Test on both mobile and desktop viewports
5. Ensure all error states are handled gracefully

## License

MIT

## Contact

Ronnie Princi
ronnie@creartech.com
