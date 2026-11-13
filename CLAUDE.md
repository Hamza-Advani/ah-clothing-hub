# AH Clothing Hub — Project Guide for Claude

> If a session stops, the user will say **"Read CLAUDE.md and PROGRESS.md and continue"**.
> Read both files, find the first unchecked task in PROGRESS.md, and continue exactly from there.

## 0. Owner requirements (in addition to the full spec in §9)
- **Frontend and backend live in separate folders**: `frontend/` and `backend/`.
- Login page with Email/Password + **Google login**. Signup for new users.
- **Persistent login**: once logged in, the user stays logged in on next visits (Firebase `browserLocalPersistence`). New users must sign up / log in.
- Users can **change password**, reset forgotten password, edit profile.
- Claude prepares all env variable *names* and setup (Firebase, Firebase Admin, Cloudinary, Resend). The owner adds the values to `.env.local` / `.env` themselves. **Never ask for secrets in chat.**
- Premium, professional look with excellent UI/UX.
- **Beautiful intro loading screen** (brand splash) when the site first opens.
- Communicate with the owner in simple English / Roman Urdu-friendly language.

## 1. Architecture

```
AH CLOTHING HUB/
├── CLAUDE.md, PROGRESS.md
├── frontend/        Next.js (App Router, TS) — storefront + /admin UI
│   ├── src/app/(store)/...     customer pages
│   ├── src/app/admin/...       admin panel pages
│   ├── src/components/ui       shadcn-style primitives
│   ├── src/components/store    storefront components
│   ├── src/components/admin    admin components
│   ├── src/lib/                firebase client, api client, utils, dummy data
│   └── src/store/              zustand stores (cart, wishlist, ui)
└── backend/         Node + Express + TypeScript REST API
    ├── src/routes/             orders, products, uploads, admin, contact, coupons...
    ├── src/services/           pricing, stock, analytics, notifications
    ├── src/payments/           payment provider modules (cod, manual, future gateways)
    ├── src/notifications/      email (Resend + React Email), whatsapp (future Cloud API)
    ├── src/emails/             React Email templates
    ├── src/middleware/         auth (verify Firebase ID token), admin, rate-limit, validate
    ├── src/lib/                firebase-admin, cloudinary, resend, env
    └── scripts/make-admin.ts   `npm run make-admin -- you@email.com`
```

- **Reads** (catalog, own profile, own orders, admin real-time dashboards) go straight from the browser to Firestore via the client SDK and `onSnapshot`, protected by security rules.
- **Writes that matter** (place order, price/total calculation, coupon redemption, stock changes, status changes, payment approval, product CRUD, settings, admin users, signed Cloudinary uploads, emails) go through the **backend** using Firebase Admin SDK. Frontend sends `Authorization: Bearer <Firebase ID token>`.
- Frontend env `NEXT_PUBLIC_API_URL` points to the backend (`http://localhost:4000` in dev).
- Until Firebase keys exist, the frontend falls back to **dummy data** (`src/lib/dummy-data.ts`) so the UI is viewable. `isFirebaseConfigured()` decides.
- Deployment: two Vercel projects (frontend = Next.js, backend = Express on Vercel), one GitHub repo.

## 2. Tech stack
Frontend: Next.js (latest), TypeScript, Tailwind CSS v4, shadcn/ui-style components (Radix), Framer Motion, lucide-react, Recharts, Firebase JS SDK, zustand, react-hook-form + zod, sonner (toasts), embla-carousel.
Backend: Express 5, TypeScript, firebase-admin, cloudinary, resend + @react-email/components, zod, express-rate-limit, helmet, cors.
Currency PKR (`Rs. 4,990`), phone `+92 3XX XXXXXXX`, Pakistani cities list.

## 3. Design system — "Modern Heritage"
Classic couture elegance (serif display, ivory, brass) + modern 2026 UI (soft glass, crisp grid, micro-motion).

### Colors (CSS variables in `frontend/src/app/globals.css`)
| Token | Light | Dark (admin) | Use |
|---|---|---|---|
| `--background` | `#FAF7F2` ivory | `#0E0F0F` | page bg |
| `--surface` | `#FFFFFF` | `#161818` | cards |
| `--muted` | `#F1EBE1` sand | `#1E2121` | alt sections, skeleton |
| `--foreground` | `#141414` ink | `#F2EFEA` | text |
| `--muted-foreground` | `#6B6560` stone | `#9A958F` | secondary text |
| `--border` | `#E6DED2` | `#2A2E2E` | lines |
| `--primary` | `#141414` ink | `#F2EFEA` | primary buttons |
| `--accent` | `#B08D57` brass | `#C9A46A` | highlights, links, stars |
| `--emerald` | `#1F3D36` | `#3F7A6B` | secondary brand, admin accents |
| `--sale` | `#B4492F` terracotta | `#E0694C` | sale price, badges |
| `--success` | `#2F7D5B` | `#4FB386` | |
| `--warning` | `#C98A1B` | `#E3A93B` | |
Charts palette: `#1F3D36, #B08D57, #B4492F, #6B8F86, #D9C3A0, #3E3A36`.

### Typography (Google Fonts via `next/font`)
- Display: **Cormorant Garamond** (500/600, italic for accents) — headings, hero, product names on PDP.
- Body/UI: **Manrope** (400/500/600/700) — everything else.
- Scale: `display 56/64→40/44 mobile`, `h1 44/52`, `h2 34/40`, `h3 24/32`, `h4 18/26`, `body 15/24`, `small 13/20`, `eyebrow 11/16 uppercase tracking-[0.22em]`.

### Spacing / layout
4px base. Section padding `py-16 md:py-24`. Container `max-w-[1440px] px-4 md:px-8`. Product grid gap `gap-x-4 gap-y-10 md:gap-x-6`.

### Radius / shadows
- Storefront buttons & inputs: `rounded-none`/`2px` (couture sharpness); cards & images `rounded-[6px]`; pills `rounded-full`.
- Admin: `rounded-xl` cards, `rounded-lg` inputs.
- Shadows: `--shadow-soft: 0 1px 2px rgb(20 20 20/.04), 0 8px 24px -12px rgb(20 20 20/.12)`; `--shadow-lift: 0 18px 40px -18px rgb(20 20 20/.28)`.

### Components
- **Button**: `primary` (ink bg, ivory text, uppercase tracking-wide 12px, h-12), `outline` (1px ink border), `accent` (brass), `ghost`, `link` (underline-offset animation). Hover: subtle bg shift + arrow nudge.
- **Input**: h-12, 1px border, bg surface, focus ring brass 2px. Labels 12px uppercase tracking.
- **Card (product)**: 3:4 image, second image cross-fades on hover, quick-add bar slides up, wishlist heart top-right, badges top-left.
- **Badge**: `new` (ink), `sale` (terracotta), `bestseller` (brass), `soldout` (stone) — 10px uppercase, tracking-wider.
- **Skeleton**: sand shimmer.
- **Toast**: sonner, ink bg.

### Motion (Framer Motion)
Ease `[0.22, 1, 0.36, 1]`, durations 0.3–0.7s. Reveal on scroll = fade + 24px rise, stagger 0.06s. Image hover scale 1.04 over 0.8s. Drawers slide 0.45s. Respect `prefers-reduced-motion`.
Intro splash: monogram "AH" draws in, wordmark letter-spacing expands, brass line sweeps, curtain lifts. Shown once per session (sessionStorage).

## 4. Data model (Firestore)
```
users/{uid}         { uid, name, email, phone, photoURL, role:'customer'|'staff'|'admin', blocked:bool,
                      addresses:[{id,label,name,phone,address,city,isDefault}], wishlist:[productId],
                      ordersCount, totalSpent, createdAt, updatedAt }
products/{id}       { name, slug, description(html), categoryId, categorySlug, tags[], price, salePrice|null,
                      sku, sizes[], colors:[{name,hex}], variants:[{size,color,stock}], totalStock,
                      images:[{url,publicId,order,alt}], weight, material, care,
                      active, featured, newArrival, bestSeller, rating, reviewCount, soldCount,
                      createdAt, updatedAt }
productsPrivate/{id}{ costPrice }                                   // admin-only (rules)
categories/{id}     { name, slug, description, image:{url,publicId}, order, active }
orders/{id}         { orderNumber:'AH-240001', userId|null, customer:{name,phone,email},
                      shipping:{address,city,notes},
                      items:[{productId,name,slug,image,size,color,qty,price,unitPrice,discount,lineTotal}],
                      subtotal, discount, couponCode|null, deliveryCharge, total,
                      payment:{method:'cod'|'jazzcash'|'easypaisa', status:'pending'|'awaiting_approval'|'paid'|'rejected', screenshot:{url,publicId}|null, txnId|null},
                      status:'pending'|'confirmed'|'packed'|'shipped'|'delivered'|'cancelled'|'returned',
                      statusHistory:[{status,at,by,note}], courier:{name,trackingNumber}|null,
                      stockRestored:bool, createdAt, updatedAt }
ordersPrivate/{id}  { revenue, cost, profit, items:[{productId,costPrice,qty}] }   // admin-only
reviews/{id}        { productId, userId, userName, rating, title, body, verified, status:'pending'|'approved'|'hidden', createdAt }
coupons/{code}      { code, type:'percent'|'fixed', value, minOrder, maxDiscount|null, expiresAt|null, usageLimit|null, usedCount, active, createdAt }
messages/{id}       { name, email, phone, subject, message, read, repliedAt|null, createdAt }
settings/store      { storeName, logo, favicon, phone, whatsapp, email, address, socials:{instagram,facebook,tiktok,youtube},
                      deliveryCharge, freeDeliveryThreshold, citiesServed[], profitCountsStatuses[],
                      payments:{cod:{enabled}, jazzcash:{enabled,accountTitle,accountNumber}, easypaisa:{enabled,accountTitle,accountNumber}},
                      announcement:[string], heroBanners:[{id,image,title,subtitle,ctaLabel,ctaLink,order}],
                      templates:{whatsapp:{[status]:string}, email:{[status]:{subject,body}}} }
settings/pages      { about, faq:[{q,a}], returns, privacy, terms, contact }
admins/{uid}        { uid, email, name, role:'admin'|'staff', permissions:[string], createdAt }
counters/orders     { next }                                       // order number sequence
stats/daily_{yyyy-mm-dd} (optional rollups)
```
Admin role = Firebase custom claim `role: 'admin'|'staff'` (+ `admins/{uid}` doc for permissions).

## 5. Security rules summary
- Products/categories/approved reviews/settings: public read. Writes: admin only.
- `productsPrivate`, `ordersPrivate`, `admins`, `messages`, `counters`: admin only.
- `users/{uid}`: owner read/write (cannot change `role`, `blocked`, `totalSpent`); admin read/write.
- `orders`: owner read where `userId == auth.uid`; admin read/write; **no client creates** (backend only).
- Backend recalculates every price, discount, delivery charge and total.

## 6. Env variables
`frontend/.env.local` (see `frontend/.env.example`):
`NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
`backend/.env` (see `backend/.env.example`):
`PORT, CORS_ORIGIN, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL, SITE_URL`

## 7. Working rules
- Phase order in PROGRESS.md. Keep going without waiting unless something is needed from the owner.
- After each phase: `npm run lint` + `npm run build` in both folders, fix errors, tick PROGRESS.md, git commit, short summary + how to test.
- Never hardcode keys. `.env*` (except `.env.example`) are gitignored.
- Reusable components, clean folders, zod on every input, rate-limit sensitive routes.
- Cost price & profit never reach customer-facing code paths.

## 8. Commands
- Both servers together (project root): `npm run dev`
- Frontend: `cd frontend && npm run dev` (http://localhost:3000)
- Backend: `cd backend && npm run dev` (http://localhost:4000)
- Make admin: `cd backend && npm run make-admin -- you@email.com`

## 9. Full original specification

### 1. TECH STACK
- Next.js (latest, App Router) + TypeScript
- Tailwind CSS + shadcn/ui + Framer Motion + lucide-react icons
- Recharts for all admin charts and graphs
- Firebase Authentication (Email/Password + Google login)
- Firestore database, using real-time listeners (onSnapshot) in the admin panel so data updates live without refreshing
- Firebase Admin SDK on the server for all sensitive operations (orders, prices, admin actions, status changes)
- Cloudinary for all images (products, categories, banners, logo, payment screenshots)
- Resend for transactional emails with beautiful React Email templates
- zod for validation, react-hook-form for forms
- Hosting on Vercel, code on GitHub
- Currency PKR (Rs.), Pakistani phone format (+92 3XX XXXXXXX), list of Pakistani cities in checkout

### 2. DESIGN
- Premium, stylish, modern 2026-level fashion brand design mixing classic elegance with modern UI.
- Mobile-first, perfectly responsive. Big product images, white space, clear hierarchy, subtle animations.
- Skeleton loaders, empty states, toasts, friendly errors. Very fast simple checkout. Trust badges (COD, easy returns, secure payment).
- Accessible: contrast, alt text, keyboard navigation.
- Admin: premium SaaS dashboard, collapsible sidebar, top bar, stat cards, charts, clean tables, light & dark mode, mobile usable.

### 3. CUSTOMER WEBSITE
- Announcement bar + header (logo, category menu, search, wishlist, account, cart count)
- Homepage: hero slider (admin banners), shop by category, new arrivals, best sellers, sale, featured, trust badges, reviews, newsletter, footer
- Shop/category: filters (category, size, color, price range, in stock, on sale), sorting (newest, price, popularity), pagination/infinite scroll
- Product page: gallery of ALL images with thumbnails, zoom, mobile swipe; size & color; stock per size; size guide; price/sale price; add to cart; buy now; wishlist; reviews & ratings; related products
- Instant search with suggestions
- Cart slide-out drawer + full cart page; wishlist page
- Account: signup, login, Google login, forgot password, profile edit, saved addresses, My Orders with live status timeline + tracking number, write reviews for purchased products
- Checkout: name, phone, email, address, city, notes, delivery charges, free-delivery threshold, coupon
- Payments: COD, manual JazzCash/EasyPaisa (store account details from settings, upload screenshot, admin approves/rejects). Payments as separate module for future gateways (JazzCash/EasyPaisa/Safepay).
- Order success page with order number + summary
- Floating WhatsApp button (number from settings); Contact page (WhatsApp, email, phone, form → admin inbox)
- Pages: About, Contact, FAQ, Return & Exchange, Privacy, Terms (editable in admin)
- SEO: meta, OG images, sitemap, robots.txt, fast, optimized images

### 4. ADMIN PANEL (/admin)
Access: admin role via Firebase custom claims, checked on server & in rules. Script to make an email admin.
A) Real-time dashboard: stat cards (today's orders, today's sales, today's profit, total revenue, total profit, total orders, pending orders, total customers, AOV, low-stock) with % change vs previous period. Date filter: Today, Yesterday, 7d, 30d, This month, This year, Custom. Charts: sales/revenue over time (area), profit over time (line), revenue vs cost vs profit (bar), orders over time (bar), orders by status (donut), payment methods (pie), top products (horizontal bar), sales by category, sales by city (bar), new customers (line). Live recent orders with sound/toast on new order. Low/out-of-stock alerts. Export CSV/Excel (sales, orders, profit, products).
Profit: product costPrice admin-only. Profit = selling price − cost − discount per item, summed per order; stored on order server-side (revenue, cost, profit). Only Delivered (or non-cancelled, configurable) orders count.
B) Products: add/edit/delete/duplicate; active, featured, new arrival toggles. Fields: name, slug, rich description, category, tags, price, sale price, cost price, SKU, sizes, colors, stock per size/color, weight, material, care. Images up to 8: upload from computer (drag-drop, multi-select) & phone camera/gallery, preview, progress bars, drag reorder, set cover, delete, client compression, signed Cloudinary uploads. Bulk: delete, hide/show, change category, update stock. Search, filter, sort.
C) Categories: CRUD with image and display order.
D) Orders: real-time table with search & filters (status, payment method, payment status, city, date range). Detail: customer, items with images/size/color, totals, cost & profit, screenshot viewer. Status Pending→Confirmed→Packed→Shipped→Delivered + Cancelled, Returned with history timeline. Courier + tracking number. Approve/reject manual payments. Print invoice & packing slip. Stock decreases on order, restored on cancel/return.
E) Communication: "Send WhatsApp" (wa.me with status template, editable) and "Send Email" (custom via Resend) on order & customer pages. Auto emails: order placed (customer + admin), status changes (Confirmed, Shipped+tracking, Delivered, Cancelled). Notification module ready for WhatsApp Cloud API. Messages inbox with read/unread & email reply.
F) Customers: list, search, details, order history, total spent, block/unblock.
G) Coupons: percent/fixed, min order, expiry, usage limit, active, usage stats.
H) Reviews: approve, hide, delete.
I) Settings: store name, logo, favicon, phone, WhatsApp, email, address; delivery charges, free threshold, cities; JazzCash/EasyPaisa details; homepage hero banners, announcement, featured sections; socials; policy pages, FAQ; WhatsApp & email templates.
J) Admin users: add admins/staff with roles & permissions.

### 6. SECURITY
No hardcoded keys; .env.example; .env.local gitignored. Strict rules. Server recalculates totals. zod everywhere, rate limiting, protected admin routes.

### 7. PHASES
1 Setup, design system, storefront UI · 2 Firebase Auth + accounts + Firestore · 3 Admin layout, products (multi-image), categories · 4 Cart, checkout, orders, COD + manual payments · 5 Order management, emails, WhatsApp, inbox · 6 Real-time analytics + profit + reports · 7 Customers, coupons, reviews, settings, admin users, policy pages, SEO · 8 Rules, testing, performance, GitHub push, Vercel deploy (gh + vercel CLIs; add env vars to Vercel).
