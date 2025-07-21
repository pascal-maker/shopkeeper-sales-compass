# Development Guide

## Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure Supabase: Update client credentials
4. Start development: `npm run dev`

## Project Structure
```
src/
├── components/     # UI components
├── services/       # Business logic
├── hooks/          # Custom React hooks
├── contexts/       # Global state
├── pages/          # Route components
└── types/          # TypeScript definitions
```

## Key Development Patterns
- Offline-first data handling
- Custom hooks for business logic
- Component composition patterns
- Service layer for API interactions

## Testing
- Unit tests: `npm run test`
- Component testing with React Testing Library
- Integration tests for sync functionality

## Build & Deploy
- Build: `npm run build`
- Preview: `npm run preview`
- Deploy via Lovable platform

## Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits