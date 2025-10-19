# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Studio Album is a Next.js-based photo album and certificate management system with MySQL database, NextAuth.js authentication, and Volcengine TOS (object storage) integration. It supports three-tier visibility (private/internal/public), role-based access control (admin/member), shareable links with password protection, and batch download capabilities.

## Development Commands

### Essential Commands

- `pnpm dev` - Start development server at http://localhost:3000
- `pnpm build` - Create production build
- `pnpm start` - Run production build
- `pnpm lint` - Run ESLint

### Database Commands

- `pnpm prisma:generate` - Generate Prisma client after schema changes
- `pnpm prisma:push` - Sync schema.prisma to MySQL database (use instead of migrations)

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure required variables:
   - `DATABASE_URL` - MySQL connection string
   - `NEXTAUTH_SECRET` - Random secret for JWT signing
   - `NEXTAUTH_URL` - Application URL (default: http://localhost:3000)
   - `TOS_ACCESS_KEY_ID`, `TOS_SECRET_ACCESS_KEY`, `TOS_REGION`, `TOS_ENDPOINT`, `TOS_BUCKET` - Volcengine TOS credentials
   - `NEXT_PUBLIC_TOS_BASE_URL` - Public URL for accessing uploaded images
3. Run `pnpm prisma:push` to initialize database
4. First registered user becomes admin automatically

## Architecture Overview

### Authentication & Authorization Flow

- **NextAuth.js** with Credentials provider (lib/auth.ts:8-89)
- JWT-based sessions with role embedded in token
- User statuses: `pending` (awaiting approval), `active`, `rejected`
- First user auto-promoted to admin; subsequent users start as `pending` members
- Auth guards in lib/auth-guards.ts:
  - `requireAuth()` - Validates user session
  - `requireAdmin()` - Restricts to admin role

### Permission Model

- **Admins**: Full access to all categories, photos, and users
- **Members**: Can upload to internal/public categories; only manage their own uploads
- **Category visibility**:
  - `private` - Admin-only access
  - `internal` - All authenticated users
  - `public` - Anonymous access allowed

### Storage Architecture (lib/storage.ts)

- **Image Processing Pipeline**:
  1. Validate file type (JPG/PNG/GIF/WebP) and size (10MB max)
  2. Generate unique filename: `{timestamp}-{uuid}.{ext}`
  3. Upload original to TOS at `{TOS_UPLOAD_PREFIX}/{filename}`
  4. Generate 400x400 WebP thumbnail with sharp
  5. Upload thumbnail to `{TOS_THUMBNAIL_PREFIX}/thumb-{filename}`
  6. Store metadata in database via Prisma
- **Key functions**:
  - `persistImage(file)` - Full upload pipeline
  - `deleteImageAssets(filename)` - Removes both original and thumbnail
  - `getPublicObjectUrl(filename)` - Construct public URL for original
  - `getPublicThumbnailUrl(filename)` - Construct public URL for thumbnail

### Database Schema (prisma/schema.prisma)

- **User**: id, username (unique), password (bcrypt hashed), role, status
- **Category**: id, name, description, visibility, photos[], shareLinks[]
- **Photo**: id, filename, originalName, description, categoryId, uploaderId, timestamps
- **ShareLink**: id, categoryId, token (unique UUID), password (optional, bcrypt), expiresAt
- Cascade deletes: Category deletion removes all photos and share links

### API Route Patterns

All routes follow consistent error handling and validation:

- Input validation with Zod schemas
- Auth checks via `requireAuth()` or `requireAdmin()`
- Prisma queries with proper relations
- Standardized JSON responses

**Key routes**:

- `POST /api/upload` - Upload image with category assignment (lib/storage.ts integration)
- `GET/POST/PUT/DELETE /api/categories` - Category CRUD (admin-only for mutations)
- `GET/DELETE /api/photos` - Photo listing and deletion (ownership checks)
- `POST /api/share` - Create shareable link with optional password/expiry
- `GET /api/share?token={token}` - Access shared category (validates password/expiry)
- `GET/PUT /api/users` - User management (admin approves/rejects pending users)

### Component Organization

- **Server Components**: Pages in app/\* (leverage Next.js 15 App Router)
- **Client Components**: Interactive UI in components/\* (marked with `"use client"`)
- **Key components**:
  - `photo-grid.tsx` - Gallery view with lightbox, batch selection, ZIP download
  - `admin-dashboard.tsx` - User approval, category management, photo oversight
  - `upload-form.tsx` - Multi-file upload with category selection
  - `share-viewer.tsx` - Password-protected category access
  - `theme-toggle.tsx` - next-themes integration for dark mode

### Styling System

- Tailwind CSS 4 with PostCSS
- shadcn/ui components (Radix UI primitives)
- Design tokens via tailwind-merge and clsx
- Responsive breakpoints used throughout

## Common Development Scenarios

### Adding a New API Route

1. Create `app/api/{name}/route.ts`
2. Import auth guards from `@/lib/auth-guards`
3. Define Zod schema for validation
4. Use `requireAuth()` or `requireAdmin()` pattern
5. Query Prisma with proper error handling
6. Return `NextResponse.json()`

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `pnpm prisma:push` (development only)
3. Run `pnpm prisma:generate` to update client
4. Restart dev server

### Adding UI Components

1. Place in `components/` with kebab-case filename
2. Use PascalCase for component names
3. Mark client interactivity with `"use client"`
4. Import shadcn/ui primitives from `@/components/ui/*`
5. Use Tailwind utilities for styling

### Debugging TOS Upload Issues

- Check `lib/storage.ts` configuration validation
- Verify `.env` has all `TOS_*` and `NEXT_PUBLIC_TOS_BASE_URL` variables
- Inspect sharp thumbnail generation errors
- Test TOS connectivity with bucket policies

## Technical Constraints

- **No test suite**: Manual testing required (consider adding tests under `__tests__/`)
- **Database migrations**: Use `prisma:push` instead of formal migrations
- **Image formats**: Limited to JPG, PNG, GIF, WebP (enforced in lib/storage.ts:6)
- **Thumbnail size**: Fixed at 400x400 WebP, quality 80 (lib/storage.ts:63-64)
- **File size limit**: 10MB per upload (lib/storage.ts:7)

## Integration Points

### Volcengine TOS

- SDK: `@volcengine/tos-sdk` (lib/storage.ts:4)
- Operations: putObject, deleteObject, getObjectV2
- Error handling: Check `TosServerCode.NoSuchKey` for 404s (lib/storage.ts:264-266)

### NextAuth

- Configuration in lib/auth.ts
- Session accessed via `auth()` helper or `getServerSession(authOptions)`
- Custom session type defined in next-auth.d.ts

### Prisma ORM

- Client instantiated in lib/db.ts
- Always use `prisma.{model}.{operation}` pattern
- Prefer `include` over separate queries for relations
