# POS Application Documentation

## Overview

This is a comprehensive Point of Sale (POS) application built with React, TypeScript, Tailwind CSS, and Supabase. The application provides offline-first functionality with robust data synchronization capabilities, allowing users to manage inventory, process sales, handle customer relationships, and track transactions even when connectivity is intermittent.

## Key Features

- **Offline-First Architecture**: Full functionality available without internet connection
- **Robust Data Synchronization**: Automatic bi-directional sync with conflict resolution
- **Inventory Management**: Product catalog with stock tracking and low-stock alerts
- **Sales Processing**: Multi-step sales workflow with payment options
- **Customer Management**: Customer profiles with credit tracking
- **Reporting**: Sales history and analytics
- **Multi-currency Support**: Configurable currency display
- **Role-based Access Control**: Admin and cashier roles with appropriate permissions

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling with custom design system
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Lucide React** for icons
- **Recharts** for data visualization
- **Sonner** for toast notifications

### Backend
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with Row Level Security (RLS)
- **Custom sync architecture** for offline-online data consistency

### State Management
- **React Context** for global state (Auth, Settings)
- **localStorage** for offline data persistence
- **Custom hooks** for data operations and sync management

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Sync Layer    │    │   Supabase      │
│   (React App)   │◄──►│   (Custom)      │◄──►│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   localStorage  │    │   Validation    │    │   PostgreSQL    │
│   (Offline)     │    │   & Retry       │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Documentation Structure

This documentation is organized into the following sections:

1. **[Frontend Architecture](./frontend-architecture.md)** - Component structure, routing, and UI patterns
2. **[Sync System](./sync-system.md)** - Comprehensive sync functionality documentation
3. **[Database Schema](./database-schema.md)** - Supabase tables, relationships, and policies
4. **[API Integration](./api-integration.md)** - Supabase client usage and data operations
5. **[Authentication & Security](./auth-security.md)** - User management and RLS policies
6. **[Development Guide](./development-guide.md)** - Setup, testing, and deployment
7. **[Component Reference](./component-reference.md)** - Detailed component documentation

## Quick Start

1. **Prerequisites**: Node.js 18+, Supabase account
2. **Installation**: `npm install`
3. **Environment**: Configure Supabase credentials
4. **Development**: `npm run dev`
5. **Build**: `npm run build`

## Key Concepts

### Offline-First Design
The application is designed to work primarily offline, with sync happening in the background. All user actions are immediately persisted to localStorage and queued for synchronization when connectivity is available.

### Data Flow
1. User actions update localStorage immediately
2. Sync service monitors for changes and connectivity
3. When online, changes are validated and pushed to Supabase
4. Conflicts are resolved using timestamp-based strategies
5. Remote changes are pulled and merged with local data

### Sync Status
The application provides real-time sync status through a dedicated widget that shows:
- Online/offline status
- Last sync timestamp
- Pending sync operations
- Error notifications

For detailed information about each aspect of the application, please refer to the specific documentation files in this directory.