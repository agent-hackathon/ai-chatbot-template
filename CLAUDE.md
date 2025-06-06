# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Setup and Dependencies:**
```bash
pnpm install              # Install dependencies
vercel env pull           # Download environment variables
```

**Development:**
```bash
pnpm dev                  # Start development server with Turbo mode
pnpm build                # Run migrations and build for production
pnpm start                # Start production server
```

**Code Quality:**
```bash
pnpm lint                 # Run linting with Next.js and Biome
pnpm lint:fix             # Fix linting issues automatically
pnpm format               # Format code with Biome
```

**Database Management:**
```bash
pnpm db:studio            # Open Drizzle Studio for database management
pnpm db:generate          # Generate new migrations
pnpm db:migrate           # Run migrations manually
pnpm db:push              # Push schema directly to database
```

## Architecture Overview

**Technology Stack:**
- Next.js 15 with App Router and React 19 RC
- Vercel AI SDK v4 with multi-provider support (OpenAI, Anthropic, Fireworks)
- PostgreSQL with Drizzle ORM for type-safe database operations
- NextAuth.js v5 beta with Microsoft Entra ID authentication
- Tailwind CSS with Radix UI components
- Biome for linting and formatting (replaces ESLint/Prettier)

**Key Architectural Patterns:**

1. **Route Organization:**
   - `app/(auth)/` - Authentication routes and middleware
   - `app/(chat)/` - Chat functionality with streaming API routes
   - Route groups organize related functionality while sharing layouts

2. **Database Schema:**
   - Users, Chats, Messages, Documents, Votes, and Suggestions tables
   - Composite primary keys for document versioning
   - Automatic migrations run during build process

3. **AI Integration:**
   - Streaming responses via `streamText` with tool calling
   - Tools in `lib/ai/tools/` follow Zod schema pattern
   - Multi-model support with runtime provider switching

4. **Artifacts System:**
   - Real-time collaborative editing for text, code, image, and sheet artifacts
   - Version control with visual diff capabilities
   - Four artifact types each with client/server components

**Component Patterns:**
- Server Components for data fetching with Server Actions
- Client Components with `use client` directive for interactivity
- Custom hooks in `hooks/` for reusable stateful logic
- UI components built on Radix primitives in `components/ui/`

**State Management:**
- SWR for server state caching and synchronization
- React state for UI interactions
- Database mutations via Server Actions with optimistic updates

**File Upload and Storage:**
- Vercel Blob for file storage
- `@vercel/blob` integration in upload routes
- Multimodal input handling for text and file attachments

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for AI providers
- `POSTGRES_URL` for database connection
- `NEXTAUTH_SECRET` for session encryption
- `AUTH_MICROSOFT_ENTRA_ID_*` for authentication
- `BLOB_READ_WRITE_TOKEN` for file storage

## Development Workflow

1. **Adding New AI Tools:**
   - Create tool in `lib/ai/tools/` with Zod schema
   - Export from `lib/ai/prompts.ts`
   - Add to tools array in chat API route

2. **Database Changes:**
   - Modify schema in `lib/db/schema.ts`
   - Generate migration with `pnpm db:generate`
   - Test migration with `pnpm db:push`

3. **Component Development:**
   - Use existing UI primitives from `components/ui/`
   - Follow server/client component patterns
   - Implement proper TypeScript types

4. **Authentication:**
   - Protect routes using middleware patterns
   - Access user session via `auth()` function
   - User creation handled automatically on first login