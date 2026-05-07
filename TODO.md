# TODO — Vercel deploy ready (no leaked secrets)

- [x] Step 1: Inspect/adjust `.gitignore` to ensure `.env` and secret files are never committed.

- [x] Step 2: Remove Mistral direct frontend usage (stop `VITE_MISTRAL_API_KEY` being bundled to browser).
- [x] Step 3: Add server/Edge function to call Mistral (uses `process.env.MISTRAL_API_KEY` only server-side).



- [x] Step 4: Update `src/routes/symptoms.tsx` to invoke the server function instead of calling Mistral directly.

- [ ] Step 5: Ensure Supabase env naming matches code expectations (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and server vars).
- [ ] Step 6: Add/Update `README.md` with Vercel Environment Variables list.
- [x] Step 7: Run `npm run build` and fix any build/runtime errors.
- [ ] Step 8: Confirm `vercel.json` / build config (if any) and run Vercel deploy checklist.


