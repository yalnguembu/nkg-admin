# Admin Catalogue Prototype - API Server

A robust backend service built with [NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/), designed to manage the catalogue, orders, stock, and administrative functions of the Admin Catalogue Prototype.

## 📚 Project Structure

The server is organized into modular features within `src/modules`:

### Core Domain Modules
- **Catalogue** (`src/modules/catalogue`): Manages the product catalog hierarchy including Brands, Categories, Models, Products, and Services.
- **Orders** (`src/modules/orders`): Handles the full order lifecycle, including:
    - Order creation and management
    - Quote generation
    - Installation pricing calculations
    - Payment processing
- **Stock** (`src/modules/stock`): Real-time inventory management, stock reservations, and adjustments.
- **Customers** (`src/modules/customers`): Customer profiles and data management.
- **Cart** (`src/modules/cart`): Shopping cart functionality for the frontend.

### Administrative Modules
- **Admin** (`src/modules/admin`): System configuration, user management, and administrative tools.
- **Auth** (`src/modules/auth`): Authentication and authorization (JWT-based).
- **Reports** (`src/modules/reports`): Data reporting and analytics.
- **Upload** (`src/modules/upload`): File upload handling (e.g., product images).

## 🛠️ Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Language**: TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL installed and running
- npm or pnpm

### Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd server
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup**:
    - Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    - Update the `DATABASE_URL` in `.env` to point to your PostgreSQL database.

4.  **Database Migration**:
    - Push the schema to the database:
        ```bash
        npx prisma db push
        ```
    - (Optional) Seed the database:
        ```bash
        npx prisma db seed
        ```

### Running the Application

```bash
# development
npm run start

# watch mode (recommended for dev)
npm run start:dev

# production mode
npm run start:prod
```

The API will be available at `http://localhost:3000` (default).

## 🧪 Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## 📄 API Documentation

This project typically uses Swagger/OpenAPI. Once the server is running, you can access the interactive API docs at:
`http://localhost:3000/api` (if configured in `main.ts`).
