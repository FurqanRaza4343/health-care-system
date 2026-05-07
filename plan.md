# Edit Plan (Vercel deploy: /favicon.ico 404)

## Information Gathered
- `src/routes/__root.tsx` me `head.links` ke andar `{ rel: "icon", href: "/favicon.ico" }` aur `{ rel: "apple-touch-icon", href: "/favicon.ico" }` already set hai.
- Local me `public/favicon.ico` exist karta hai (VSCode me visible).
- `vite.config.ts` minimal hai (`defineConfig()`), so static asset handling default Vite behavior par depend kar raha hai.
- Problem: Vercel par browser `/favicon.ico` request karta hai but 404 aa raha hai—usually meaning Vercel build output me `public/favicon.ico` copy nahi ho raha, ya root path mismatch / SPA fallback configuration issue hai.

## Plan
1. `public/favicon.ico` ko ensure karna that file non-empty aur correct path me build me include ho.
   - Agar file empty ho, replace with a valid favicon.
   - (Tool limitation: file read for binary returned empty earlier. So we will regenerate favicon from existing `falcon.ico` OR add a small SVG fallback as `public/favicon.svg` plus update references.)
2. `src/routes/__root.tsx` me favicon links ko robust banana:
   - `href: "/favicon.ico"` ke saath `href: "/favicon.svg"` aur `href: "/favicon.png"` jese fallbacks add.
3. Build-step/asset inclusion ensure karna:
   - Vercel ko correct public directory serve ho—normally Vite uses `public/`.
   - If repo uses custom Vite plugin/build pipeline, verify `public/` is copied by checking build output after running `npm run build` locally.
4. Local build verify (optional but recommended):
   - `npm run build` run karke `dist/` me `favicon.ico` present hai ya nahi check.
5. Any other errors found during `vite build` or `vercel` build logs fix.

## Dependent Files to be edited
- `src/routes/__root.tsx`
- `public/favicon.ico` (only if needed)
- Add: `public/favicon.svg` (and optionally `public/favicon.png`)

## Followup Steps
- `npm run build`
- `dist/` me `favicon.ico` existence verify
- Vercel deploy re-test: `/favicon.ico` 200

<ask_followup_question>
Kya aap `public/favicon.ico` file ko replace karne ke liye `falcon.ico` (jo open tabs me hai) use kar sakte hain? Agar haan, mai `public/favicon.ico` ko copy karke rebuild setup bhi verify kar dunga.
</ask_followup_question>

