# Fantooo Platform

An enterprise-grade fantasy chat platform built with Next.js 14, TypeScript, Supabase, and Tailwind CSS.

## Overview

Fantooo is a sophisticated platform where real users engage with fictional profiles managed by trained operators. The platform features real-time chat, intelligent operator assignment, dynamic pricing, payment processing, and comprehensive admin controls.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **State Management**: Zustand, React Query
- **Payments**: Paystack
- **Maps**: Google Maps API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Paystack account (for payments)
- Google Maps API key (for geocoding)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fantooo-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file with:
   - Supabase URL and keys
   - Admin setup token
   - Paystack keys
   - Google Maps API key

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

Create a production build:

```bash
npm run build
```

### Project Structure

```
fantooo-platform/
├── app/                    # Next.js app directory
├── components/             # React components (to be created)
├── lib/
│   ├── supabase/          # Supabase client configuration
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── supabase/              # Database migrations and functions (to be created)
└── public/                # Static assets
```

## Features

- **User Management**: Registration, authentication, profile management
- **Real-Time Chat**: WebSocket-based messaging with sub-100ms latency
- **Credit System**: Virtual currency for paid messages
- **Operator Dashboard**: Three-panel interface for managing conversations
- **Admin Panel**: Comprehensive platform management tools
- **Payment Processing**: Secure credit purchases via Paystack
- **Analytics**: Platform-wide metrics and reporting

## Development Workflow

This project follows a spec-driven development approach. See `.kiro/specs/fantooo-platform/` for:
- `requirements.md` - Feature requirements
- `design.md` - Technical design
- `tasks.md` - Implementation tasks

## License

Private and confidential.

## Support

For questions or issues, contact the development team.
