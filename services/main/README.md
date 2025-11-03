# Rentloop Engine

## Description
Rentloop Engine is a modular property rental management service designed to provide core rental operations for rentloop. It supports real-estate account managements, properties management, tenant-application management, lease agreement management, payments, etc

## Resource Dependencies
- **PostgreSQL**: Primary database for all persistent storage.
- **GORM**: ORM for Go, used for database operations and migrations.
- **Go-Chi**: HTTP router for building RESTful APIs.
- **Sentry**: Error tracking and monitoring.
- **Validator**: Input validation for API requests.
- **Reflex**: Hot-reload utility for development.
- **Swago**: [API Documentation](https://github.com/swaggo/http-swagger)

## Environment Setup
1. **Clone the repository:**
   ```sh
   git clone https://github.com/Bendomey/rent-loop.git
   cd rent-loop/services/main
   ```
2. **Install Go (>=1.23.0) and PostgreSQL.**
3. **Configure environment variables:**
   - Copy or edit `.envrc` with your database and environment settings:
     ```sh
     cp .envrc.example .envrc  # if example exists, else edit .envrc directly
     ```
   - Example variables:
     ```sh
     export GO_ENV=development
     export PORT=5003
     export DB_HOST=localhost
     export DB_PORT=5432
     export DB_USER=your_db_user
     export DB_PASS=your_db_password
     export DB_NAME=rentloop_dev
     export DB_SSLMODE=disable
     export DB_DEFAULT_DBNAME=postgres
     export SENTRY_DSN=
     export SENTRY_ENVIRONMENT=development
     export SUPER_ADMIN_NAME="Super Admin"
     export SUPER_ADMIN_EMAIL=admin@example.com
     export SUPER_ADMIN_PASSWORD=password
     export WITTYFLOW_APP_ID=fake-app-id
      export WITTYFLOW_APP_SECRET=fake-app-secret
     export RESEND_API_KEY=fake-api-key
      export SUPPORT_EMAIL=support@rentloop.com
      export SUPPORT_PHONE=0201080802
      export ADMIN_PORTAL_URL=http://localhost:3001
      export PROPERTY_MANAGER_PORTAL_URL=http://localhost:3000
      export TENANT_PORTAL_URL=http://localhost:3002
     ```
4. **Install Go dependencies:**
   ```sh
   go mod download
   make install-tools
   ```

## Database Preparation (Migration)
To initialize or update the database schema, run:

- **Initial migration (drops and recreates DB):**
  ```sh
  make setup-db
  # or
  go run init/main.go init/setup.go -init true
  ```
- **Update migration (applies new migrations):**
  ```sh
  make update-db
  # or
  go run init/main.go init/setup.go -init false
  ```

## Running the Service Locally
- **Development mode (with hot reload):**
  ```sh
  make run-dev
  # or
  ./scripts/run-dev.sh
  ```
- **Production mode:**
  ```sh
  make run
  # or
  ./scripts/run.sh
  ```

## Linting and Formatting
- **Check formatting issues:**
  ```sh
  make lint
  ```
- **Automatically fix formatting issues:**
  ```sh
  make lint-fix
  ```

## Swagger Docs
- http://localhost:5003/swagger/index.html
- http://localhost:5003/doc.json

## Features
- Input validation and error handling
- RESTful API design with Go-Chi
- Database migrations and schema management
- Sentry integration for error monitoring
- Environment-based configuration

---
For more details, see the code in `internal/handlers`, `internal/services`, and `internal/models`.
