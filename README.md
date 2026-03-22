# Introduction

rent-loop — a property rental management platform.

## Run

> Run frontend and API simultaneously with make
> `make run`

## Structure

`apps/property-manager` — React Router v7 property manager portal (port 3000)

`apps/website` — Public marketing website

`apps/go` — Flutter mobile app (Dart) for tenants

`services/main` — Go backend API (port 5003)

`services/cube` — Cube.js analytics service

## Tech Stack + Features

### Frameworks

- [React Router v7](https://reactrouter.com/) – Full-stack React framework (formerly Remix) powering the property manager portal.
- [Flutter](https://flutter.dev/) – Cross-platform mobile app for tenants (iOS & Android).
- [Golang](https://go.dev/) – Backend API service; fast, secure, and cloud-native.
- [Cube.js](https://cube.dev/) – Headless analytics API layer.

### Platforms

- [Fly.io](https://fly.io/) – Application deployment (staging + production).
- [AWS](https://aws.amazon.com/) – S3 for file/document storage via presigned URLs.

### UI

- [Tailwind CSS v4](https://tailwindcss.com/) – Utility-first CSS framework.
- [Shadcn UI](https://ui.shadcn.com/) – Radix-based component primitives with full dark/light mode support.
- [Lexical](https://lexical.dev/) – Extensible rich-text editor (used for document authoring).
- [Recharts](https://recharts.org/) – Composable charting library.
- [dnd-kit](https://dndkit.com/) – Drag-and-drop toolkit.

### Backend Libraries (Go)

- [chi](https://github.com/go-chi/chi) – HTTP router
- [GORM](https://gorm.io/) + [pgx](https://github.com/jackc/pgx) – ORM + PostgreSQL driver
- [go-redis](https://github.com/redis/go-redis) – Redis client (OTP / session storage)
- [Resend](https://resend.com/) – Transactional email
- [Wittyflow](https://wittyflow.com/) – SMS notifications
- [Sentry](https://sentry.io/) – Error monitoring

### State & Data

- [TanStack Query v5](https://tanstack.com/query/latest/) – Server-state management
- [TanStack Table](https://tanstack.com/table/latest/) – Headless table primitives
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) – Form handling and validation

### Databases

- PostgreSQL — Primary data store
- Redis — OTP / ephemeral data

## System Overview

<img src='assets/rent-loop.jpg' />

## Contributing

We love our contributors! Here's how you can contribute:

- [Open an issue](https://github.com/Bendomey/rent-loop/issues) if you believe you've encountered a bug.
- Make a [pull request](https://github.com/Bendomey/rent-loop/pulls) to add new features/make quality-of-life improvements/fix bugs.

<a href="https://github.com/Bendomey/rent-loop/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Bendomey/rent-loop" />
</a>
