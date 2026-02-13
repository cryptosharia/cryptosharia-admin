# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Database Setup

This project uses [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL.

1.  Update `.env` with your database credentials:
    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/cryptosharia_admin
    ```
2.  Generate migrations (if you change the schema):
    ```sh
    npx drizzle-kit generate
    ```
3.  Push schema to the database:
    ```sh
    npx drizzle-kit push
    ```

## Admin Panel

The admin panel is built with SvelteKit and TailwindCSS.
- **Layout**: `src/routes/+layout.svelte` (Sidebar, Glassmorphism design)
- **Schema**: `src/lib/server/db/schema.ts` (Drizzle schema definition)
- **Database**: `src/lib/server/db/index.ts` (DB connection)
