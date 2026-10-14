# CT_24F frontend

Next.js 16 / React 19 frontend for the catalog shop and local coursework admin. The application uses JavaScript/JSX, Tailwind CSS 4, Axios services, Lucide icons, and Motion.

## Run locally

```bash
npm ci
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` if Laravel is not at the configured local default. The Laravel API runs separately; see the root README for the Laragon setup flow.

## Checks

```bash
npm run lint
npm run build
```

Admin routes currently have no authentication or authorization. Do not expose this frontend/API as a public admin system.
