# Database Setup Guide

The application requires a PostgreSQL database to run. You are currently seeing "System Error" or "Connection Refused" because the database is not running.

## Option 1: Using Docker (Recommended)

1.  **Start Docker Desktop**
    *   Search for "Docker Desktop" in your Windows Start menu.
    *   Open it and wait until the whale icon in the bottom left is green/active.
    *   *If you don't have it installed, download it from [docker.com](https://www.docker.com/products/docker-desktop/)*.

2.  **Start the Database**
    Run this command in your terminal:
    ```bash
    docker compose up -d db
    ```

3.  **Setup the Tables**
    Once the database is running, create the tables:
    ```bash
    npx drizzle-kit push
    ```

## Option 2: Using a Cloud Database (Alternative)

If you cannot use Docker, you can use a free cloud database like [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).

1.  Create a project on Neon or Supabase.
2.  Get your **Connection String** (it looks like `postgresql://user:pass@host/db`).
3.  Open the `.env` file in this project.
4.  Replace the `DATABASE_URL` with your cloud connection string.
5.  Run `npx drizzle-kit push`.

## Verification

Once completed, the Dashboard should show "0 Tokens" instead of "System Error".
