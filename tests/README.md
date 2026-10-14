# P01 local serialization regression

Use a clean checkout without `.env` files, Node with native TypeScript stripping (Node 22.18+ or 24+), and the lockfile dependencies installed. No real account, credential, API or database is required.

`npm run test:unit` checks the DTO's TypeScript contract and seven runtime cases.

For `npm run test:security`, set `P01_PLAYWRIGHT_MODULE` to the absolute `index.mjs` of an installed Playwright/Playwright Core package with its matching Chromium installed. Set `P01_EVIDENCE_DIR` to an existing directory **outside this repository**, or omit it to use a temporary directory. Browser tooling is supplied explicitly, as in the Learning regression workflow; no new runtime dependency is added.

The suite starts a real SvelteKit dev server and a synthetic HTTP API on random loopback ports. The server uses a clean environment map and a preload that permits fetch only to those origins. The browser has a fresh profile and blocks external requests. OTP, mail, uploads, profile writes, refresh and signout terminate at the mock. It checks SSR, both layout/settings data nodes, form success/failure, authenticated calls, guest/member denial, all existing administrative roles, refresh, real login/navigation/hydration, logout, internal endpoint forwarding and response/log credential absence. It also checks the main-branch token route role matrix, sidebar visibility, token listing/detail/create/update/delete delegation and synthetic asset upload. Update and delete actions are also attempted as `posts_manager` to verify the route's mutation boundary. Captured evidence omits credential values.

`node tests/security-serialization.mjs --baseline` is a deliberate negative reproduction mode for the unpatched baseline: it expects synthetic bearer disclosure in dashboard and settings SSR. Do not use that mode as acceptance of a patch.

After `npm run build`, `node tests/security-serialization.mjs --preview` uses the built local Vite preview with production cookie settings. It still uses only loopback mocks, never a hosted deployment.

Typecheck/build and this suite do not verify backend OTP atomicity, JWT revocation, refresh persistence, production credentials, production exposure or hosted deployment identity. Those remain separately authorized workstreams.
