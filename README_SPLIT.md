# RentalHub Backend (Next.js API)

This is the **backend-only** project extracted from the original full-stack Next.js app.

## Run

1) Install deps
```bash
npm install
```

2) Create `.env.local`
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
```

3) Start the API on port **3001**
```bash
npm run dev
```

## Notes
- All endpoints are under `/api/...`.
- CORS is enabled for `/api/*` via `middleware.ts` so a separate frontend (Vite/React) can call the API.
