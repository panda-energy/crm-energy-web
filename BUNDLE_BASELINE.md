# Bundle Baseline -- Sprint 6 (2026-05-27)

## Route Sizes

| Route | Size | First Load JS |
|---|---|---|
| / | 2.05 kB | 117 kB |
| /dashboard | 132 B | 103 kB |
| /leads | 176 B | 297 kB |
| /pipeline | 27.5 kB | 258 kB |
| /cups | 165 B | 258 kB |
| /contracts | 13.8 kB | 257 kB |
| /contracts/new | 9.53 kB | 209 kB |
| /atr | 11.5 kB | 241 kB |
| /tickets | 12.6 kB | 229 kB |
| /commissions | 9.08 kB | 333 kB |
| /settings | 810 B | 103 kB |
| /portal | 2.39 kB | 117 kB |
| /portal/consumption | 5.42 kB | 325 kB |
| /portal/invoices | 7 kB | 218 kB |
| /portal/power | 7.51 kB | 200 kB |
| /sign-in | 3.25 kB | 147 kB |

## Shared JS

- First Load JS shared by all: **103 kB**
- Middleware: **87.7 kB**

## Heavy Dependencies

- recharts: only loaded on /commissions and /portal/consumption pages
- react-markdown: only loaded via AI chat panel (lazy boundary)
- dnd-kit: only loaded on /pipeline (kanban view)
- signature_pad: only loaded on /contracts/new (wizard)
- MSW: excluded from production build (dynamic import guarded by env check)

## Optimizations Applied

- `experimental.optimizePackageImports` for lucide-react, recharts, react-markdown, date-fns
- @next/bundle-analyzer available via `ANALYZE=true pnpm build`
- All heavy page components are client components (auto code-split by Next.js)

## Budget

- No route should exceed 400 kB First Load JS
- Shared chunk should stay under 120 kB
- If a route exceeds budget, investigate with `ANALYZE=true pnpm build`
