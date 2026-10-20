# P01 local serialization regression

Use a clean checkout without `.env` files, Node with native TypeScript stripping (Node 22.18+ or 24+), and the lockfile dependencies installed. No real account, credential, API or database is required.

`npm run test:unit` checks the DTO's TypeScript contract and seven runtime cases.

For `npm run test:security`, set `P01_PLAYWRIGHT_MODULE` to the absolute `index.mjs` of an installed Playwright/Playwright Core package with its matching Chromium installed. Set `P01_EVIDENCE_DIR` to an existing directory **outside this repository**, or omit it to use a temporary directory. Browser tooling is supplied explicitly, as in the Learning regression workflow; no new runtime dependency is added.

The suite starts a real SvelteKit dev server and a synthetic HTTP API on random loopback ports. The server uses a clean environment map and a preload that permits fetch only to those origins. The browser has a fresh profile and blocks external requests. OTP, mail, uploads, profile writes, refresh and signout terminate at the mock. It checks SSR, both layout/settings data nodes, form success/failure, authenticated calls, guest/member denial, all existing administrative roles, refresh, real login/navigation/hydration, logout, internal endpoint forwarding and response/log credential absence. It also checks the main-branch token route role matrix, sidebar visibility, token listing/detail/create/update/delete delegation and synthetic asset upload. Update and delete actions are also attempted as `posts_manager` to verify the route's mutation boundary. Captured evidence omits credential values.

`node tests/security-serialization.mjs --baseline` is a deliberate negative reproduction mode for the unpatched baseline: it expects synthetic bearer disclosure in dashboard and settings SSR. Do not use that mode as acceptance of a patch.

After `npm run build`, `node tests/security-serialization.mjs --preview` uses the built local Vite preview with production cookie settings. It still uses only loopback mocks, never a hosted deployment.

Typecheck/build and this suite do not verify backend OTP atomicity, JWT revocation, refresh persistence, production credentials, production exposure or hosted deployment identity. Those remain separately authorized workstreams.

## Curriculum metadata QA regression

Use clean admin and API worktrees with lockfile dependencies installed. Neither worktree may contain environment files. The API source is unchanged; point `ACADEMY_QA_API_ROOT` at its absolute path.

```sh
ACADEMY_QA_API_ROOT=/absolute/path/to/clean-api npm run test:academy-metadata:qa
```

This suite uses the existing authenticated Neon CLI session to verify the exact `qa-academy-testing` branch ID and QA endpoint before connecting. It refuses production, fixture collisions, and environment files. It starts local BFF/API processes on ports 5187/3467 with synthetic secrets and users, creates only a new synthetic `web3` hierarchy, tests all four metadata update kinds, verifies RBAC/CSRF/editorial guards and PostgreSQL invariants, and removes only its own fixture. Existing QA Academy records are hashed before and after. There are no schema migrations or production writes.

Append `-- --hold` for browser testing. The suite writes a temporary local QA-only session file with mode 0600 in the evidence directory (default: the sibling `evidence` directory; override with `ACADEMY_QA_EVIDENCE`). Use that session only on the local QA origin. Rename the synthetic Level to `FOUNDATION: DASAR-DASAR CRYPTO & NILAI ASET` through the editor, then press Enter in the test terminal to verify database persistence and clean up. Delete the local QA browser cookie after testing. The session file is removed on normal completion. Do not run concurrent instances, because the existing creation contract fixes Subject IDs to their subject enum.

Browser checks: independently expand/collapse using the chevrons; select and save Subject, Level, Chapter and Lesson by title; verify tree labels and descendants; reject blank titles; cancel node/route navigation with dirty inputs; simulate an offline save and retry; verify disabled inputs/selection during a slow save; and check native beforeunload in a regular browser. Raw DevTools reload can be automatically resolved by browser automation, so manually check cancelling reload/close before release.

Do not substitute `academy-package4-integration.spec.ts` against shared QA: its legacy setup deletes all lessons, grants, progress and completions. The metadata suite above is bounded to its own synthetic rows.
