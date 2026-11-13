# PROGRESS — AH Clothing Hub

Legend: [x] done · [ ] todo · [~] partly done (see note)

## Phase 0 — Docs
- [x] CLAUDE.md (spec, architecture, design system, data model, rules)
- [x] PROGRESS.md

## Phase 1 — Setup, design system, storefront UI ✅
- [x] Scaffold `frontend/` (Next.js 16.4 + TS + Tailwind v4) and `backend/` (Express 5 + TS)
- [x] Deps: framer-motion, lucide, radix, zustand, sonner, rhf, zod, recharts, firebase
- [x] Design tokens (globals.css), Cormorant Garamond + Manrope, UI primitives (button, input, field, badge, sheet, modal, accordion, checkbox, switch, rating, price, skeleton, empty state)
- [x] Dummy data (5 categories, 22 products × 3 verified Unsplash images, reviews, settings, pages) + demo orders generator
- [x] Intro splash loader (pure CSS, once per session)
- [x] Announcement bar, header (mega menu ≥xl, mobile drawer), footer, floating WhatsApp
- [x] Instant search overlay ("/" shortcut)
- [x] Homepage (hero slider, trust badges, categories, new arrivals, sale banner, best sellers, editorial, featured, sale, testimonials, newsletter)
- [x] Shop + category pages (filters: category/size/colour/price/stock/sale, sort, load-more pagination, mobile filter sheet)
- [x] Product page (gallery thumbs, hover zoom, mobile swipe, lightbox, colour/size, stock per size, size guide, buy now, reviews, related, recently viewed, JSON-LD)
- [x] Cart drawer + cart page + wishlist page (zustand persisted; coupon stored in cart store)
- [x] Checkout (one page, COD / JazzCash / EasyPaisa with screenshot upload) + order success page
- [x] Auth pages (login, signup, forgot password) + account (overview/profile, orders + live timeline, order detail, addresses, password & security)
- [x] Content pages (About, Contact + form, FAQ + JSON-LD, Returns, Privacy, Terms), 404, sitemap, robots, OG image, icon
- [x] Lint + build pass, screenshots verified desktop + mobile, git init + commit

## Phase 2 — Firebase Auth + accounts + Firestore
- [x] Firebase client init with env + demo-mode fallback (`isFirebaseConfigured`)
- [x] AuthProvider: persistent login (IndexedDB/local persistence, "keep me logged in"), email/password, Google (popup → redirect fallback), forgot password, change password (re-auth)
- [x] User profile doc creation, profile edit, saved addresses
- [x] Protected account routes
- [x] Backend: firebase-admin init, auth middleware (verifyIdToken + role claim), make-admin script
- [x] Catalog reads live Firestore via REST (60s revalidate) with demo fallback while DB is empty
- [x] Firebase web config added to frontend/.env.local; Cloudinary key+secret in backend/.env
- [ ] OWNER: enable Email/Password sign-in; add service-account JSON to backend/; send Cloudinary cloud name; Resend key
- [x] `npm run setup-firebase` (backend): deploys rules + indexes + seeds demo catalog — run once service account is added
- [ ] Test live auth flows once keys are added
- [ ] Lint + build + commit

## Phase 3 — Admin panel layout, products, categories
- [x] Admin guard (custom claim), layout (collapsible sidebar, topbar, light/dark mode)
- [x] Backend: signed Cloudinary upload endpoint (`POST /api/uploads/sign`)
- [x] Client upload helper with compression + progress (`frontend/src/lib/upload.ts`)
- [x] Image uploader UI (drag-drop, camera, preview, progress, reorder, cover, delete, max 8)
- [x] Backend: products CRUD + bulk actions, categories CRUD (cost price → productsPrivate)
- [x] Products table UI (search, filter, sort, bulk) + product form (all fields, variant stock grid)
- [x] Categories UI
- [x] Lint + build + commit

## Phase 4 — Cart, checkout, orders, payments
- [x] Backend pricing service, coupon validation, order create transaction (stock decrement, order counter, ordersPrivate revenue/cost/profit)
- [x] Payments module (cod, manual jazzcash/easypaisa, provider interface for future gateways)
- [x] Checkout wired to `POST /api/orders` + screenshot upload (demo fallback when backend missing)
- [x] Order success + My Orders live timeline (onSnapshot)
- [ ] End-to-end test with real keys

## Phase 5 — Order management, emails, WhatsApp, inbox
- [x] Backend: status change + history + stock restore, courier, payment approve/reject, custom email, message read/delete
- [x] Notifications module: Resend + React Email templates (order placed, admin new order, status, custom); WhatsApp Cloud API stub
- [x] Admin orders table (real-time, filters) + order detail page + screenshot viewer
- [x] Invoice + packing slip print
- [x] WhatsApp buttons with editable templates
- [x] Messages inbox UI
- [x] Lint + build + commit

## Phase 6 — Analytics
- [x] Date range filter, stat cards with % change
- [x] All Recharts charts
- [x] Live recent orders + sound/toast
- [x] Low/out-of-stock alerts
- [x] CSV/Excel export

## Phase 7 — Customers, coupons, reviews, settings, admins, pages, SEO
- [x] Backend: coupons CRUD, review moderation (+ rating recompute), customer block, settings/pages save, admin users add/remove
- [x] Customer "write review" (verified purchase enforced on backend)
- [x] SEO: metadata, OG, sitemap, robots, JSON-LD
- [x] Admin UIs: customers, coupons, reviews, settings (all sections), pages editor, admin users

## Phase 8 — Security, testing, deploy
- [x] firestore.rules + firestore.indexes.json + firebase.json (deploy with `firebase deploy --only firestore`)
- [ ] Full flow testing with live keys
- [ ] Performance pass
- [ ] GitHub repo + push (gh CLI not found in Git Bash PATH — check PowerShell)
- [ ] Vercel deploy (frontend + backend projects) + env vars

## Admin panel extras (done)
- [x] /admin/login (email+password, Google, forgot password), access guard with claim refresh
- [x] /admin/account: profile edit + change password (re-auth) + reset link for Google accounts
- [x] Staff permissions hide sidebar sections; admin-only: settings, pages, team, deletes
- [x] make-admin script: `--password` / `--name` (creates account if missing)
- [ ] OWNER: make hassanadvani08@gmail.com admin → needs service-account JSON in backend/ + Email/Password provider enabled, then `npm run make-admin -- hassanadvani08@gmail.com admin --password "<password>"`

## Notes / blockers
- **Waiting on owner for keys** (see summary in chat / `.env.example` files). UI runs in demo mode until then.
- Windows note: Bash heredocs break on apostrophes in this environment — write scripts with the Write tool.
- Screenshot helper: puppeteer-core + Edge (see scratchpad `shot.mjs`); use `MSYS_NO_PATHCONV=1`.
