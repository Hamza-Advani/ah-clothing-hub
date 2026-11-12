/**
 * Realistic demo data used until Firebase keys are configured.
 * Once Firestore is connected, src/lib/catalog.ts reads live data instead.
 */
import type { Category, PagesContent, Product, Review, StoreSettings } from "./types";

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

const IMG = {
  eastern: ["1583391733956-3750e0ff4e8b", "1597983073493-88cd35cf93b0", "1605763240000-7e93b172d754", "1610030469983-98e550d6193c", "1617627143750-d86bc21e42bb", "1610030469668-8e9f641aaf27", "1617019114583-affb34d1b3cd"],
  western: ["1485968579580-b6d095142e6e", "1614252235316-8c857d38b5f4", "1609357605129-26f69add5d6e", "1608748010899-18f300247112", "1585487000160-6ebcfceb0d03", "1550639525-c97d455acf70", "1581338834647-b0fb40704e21", "1617922001439-4a2e6562f328", "1595777457583-95e059d581b8", "1539109136881-3be0616acf4b"],
  men: ["1617137968427-85924c800a22", "1594938298603-c8148c4dae35", "1507679799987-c73779587ccf", "1552374196-1ab2a1c593e8", "1516826957135-700dedea698c", "1600091166971-7f9faad6c1e2", "1622445275463-afa2ab738c34", "1548883354-94bcfe321cbb", "1520006403909-838d6b92c22e", "1598033129183-c4f50c736f10", "1602810318383-e386cc2a3ccf"],
  basics: ["1521572163474-6864f9cf17ab", "1576566588028-4147f3842f27", "1596755094514-f87e34085b2c", "1620799140408-edc6dcb6d633", "1618354691373-d851c5c3a990", "1564584217132-2271feaeb3c5", "1562157873-818bc0726f68", "1622519407650-3df9883f76a5", "1542272604-787c3835535d", "1591047139829-d91aecb6caea"],
  kids: ["1503944583220-79d8926ad5e2", "1519238263530-99bdd11df2ea", "1622290291468-a28f7a7dc6a8"],
  lifestyle: ["1558769132-cb1aea458c5e", "1490481651871-ab68de25d43d", "1445205170230-053b83016050", "1509319117193-57bab727e09d", "1588117260148-b47818741c74"],
};

export const DUMMY_CATEGORIES: Category[] = [
  { id: "c1", name: "Women Eastern", slug: "women-eastern", description: "Lawn, chiffon & festive formals", image: { url: u(IMG.eastern[1]), publicId: "" }, order: 1, active: true },
  { id: "c2", name: "Women Western", slug: "women-western", description: "Dresses, co-ords & outerwear", image: { url: u(IMG.western[5]), publicId: "" }, order: 2, active: true },
  { id: "c3", name: "Men", slug: "men", description: "Kurtas, suits & smart casual", image: { url: u(IMG.men[0]), publicId: "" }, order: 3, active: true },
  { id: "c4", name: "Essentials", slug: "essentials", description: "Everyday tees, shirts & denim", image: { url: u(IMG.basics[6]), publicId: "" }, order: 4, active: true },
  { id: "c5", name: "Kids", slug: "kids", description: "Comfort-first little styles", image: { url: u(IMG.kids[2]), publicId: "" }, order: 5, active: true },
];

type Seed = {
  name: string;
  cat: keyof typeof IMG;
  categoryId: string;
  price: number;
  sale?: number;
  imgs: number[];
  colors: [string, string][];
  sizes?: string[];
  material: string;
  flags?: Partial<Pick<Product, "featured" | "newArrival" | "bestSeller">>;
  tags: string[];
  rating: number;
  reviews: number;
  sold: number;
  daysAgo: number;
  lowStock?: boolean;
};

const SEEDS: Seed[] = [
  { name: "Noor Embroidered Lawn 3-Piece", cat: "eastern", categoryId: "c1", price: 8990, sale: 6990, imgs: [0, 1, 2], colors: [["Ivory", "#F4EFE6"], ["Mint", "#BFD8C8"]], material: "Premium lawn, chiffon dupatta", flags: { featured: true, bestSeller: true }, tags: ["lawn", "embroidered", "3-piece"], rating: 4.8, reviews: 126, sold: 540, daysAgo: 20 },
  { name: "Zarina Festive Silk Saree", cat: "eastern", categoryId: "c1", price: 18500, imgs: [3, 5, 4], colors: [["Plum", "#4B2142"], ["Crimson", "#9E1B32"]], sizes: ["Free"], material: "Banarasi silk", flags: { featured: true, newArrival: true }, tags: ["festive", "silk", "wedding"], rating: 4.9, reviews: 48, sold: 112, daysAgo: 3 },
  { name: "Gulnaar Printed Kurta Set", cat: "eastern", categoryId: "c1", price: 5490, imgs: [1, 2, 0], colors: [["Emerald", "#1F6F5C"], ["Saffron", "#E0A42B"]], material: "Cotton cambric", flags: { newArrival: true, bestSeller: true }, tags: ["kurta", "printed", "casual"], rating: 4.6, reviews: 89, sold: 410, daysAgo: 6 },
  { name: "Mehr Bridal Lehenga", cat: "eastern", categoryId: "c1", price: 64900, sale: 54900, imgs: [4, 6, 3], colors: [["Rose", "#C2185B"]], material: "Raw silk with hand embellishment", flags: { featured: true }, tags: ["bridal", "lehenga"], rating: 5, reviews: 14, sold: 22, daysAgo: 40, lowStock: true },
  { name: "Saba Mustard Day Kurta", cat: "eastern", categoryId: "c1", price: 3990, sale: 2990, imgs: [2, 1, 0], colors: [["Mustard", "#D9A21B"]], material: "Khaddar", flags: { bestSeller: true }, tags: ["kurta", "winter"], rating: 4.5, reviews: 211, sold: 980, daysAgo: 65 },
  { name: "Alina Tweed Overcoat", cat: "western", categoryId: "c2", price: 15990, imgs: [3, 0, 1], colors: [["Camel", "#B88A5A"], ["Charcoal", "#3A3A3A"]], material: "Wool blend", flags: { featured: true, newArrival: true }, tags: ["coat", "winter"], rating: 4.7, reviews: 37, sold: 95, daysAgo: 2 },
  { name: "Iris Satin Slip Dress", cat: "western", categoryId: "c2", price: 7990, sale: 5590, imgs: [5, 4, 7], colors: [["Black", "#141414"], ["Champagne", "#E8D6B5"]], material: "Satin", flags: { bestSeller: true }, tags: ["dress", "evening"], rating: 4.6, reviews: 74, sold: 260, daysAgo: 30 },
  { name: "Hana Corduroy Midi Dress", cat: "western", categoryId: "c2", price: 6490, imgs: [4, 8, 5], colors: [["Wine", "#6E1E2F"]], material: "Corduroy cotton", flags: { newArrival: true }, tags: ["dress", "midi"], rating: 4.4, reviews: 19, sold: 61, daysAgo: 5 },
  { name: "Laila Linen Shirt Dress", cat: "western", categoryId: "c2", price: 5990, imgs: [7, 6, 1], colors: [["Sand", "#E7DCC8"], ["White", "#FFFFFF"]], material: "Pure linen", flags: { featured: true }, tags: ["linen", "summer"], rating: 4.7, reviews: 52, sold: 188, daysAgo: 15 },
  { name: "Sofia Pleated Wrap Dress", cat: "western", categoryId: "c2", price: 8490, sale: 6790, imgs: [2, 9, 8], colors: [["Teal", "#1E6E6A"]], material: "Georgette", tags: ["dress", "wrap"], rating: 4.5, reviews: 33, sold: 120, daysAgo: 50 },
  { name: "Rayyan Three-Piece Suit", cat: "men", categoryId: "c3", price: 34990, sale: 29990, imgs: [1, 0, 2], colors: [["Navy Check", "#2D3E63"]], sizes: ["S", "M", "L", "XL"], material: "Italian wool blend", flags: { featured: true, bestSeller: true }, tags: ["suit", "formal", "wedding"], rating: 4.9, reviews: 64, sold: 150, daysAgo: 25 },
  { name: "Hamza Slim Fit Blazer", cat: "men", categoryId: "c3", price: 18990, imgs: [0, 2, 5], colors: [["Royal Blue", "#23408E"], ["Black", "#141414"]], material: "Poly-viscose", flags: { newArrival: true }, tags: ["blazer", "formal"], rating: 4.6, reviews: 28, sold: 80, daysAgo: 4 },
  { name: "Daniyal Camel Overshirt", cat: "men", categoryId: "c3", price: 7490, imgs: [4, 3, 8], colors: [["Camel", "#B88A5A"]], material: "Brushed twill", flags: { featured: true, newArrival: true }, tags: ["overshirt", "casual"], rating: 4.5, reviews: 22, sold: 70, daysAgo: 1 },
  { name: "Ahmed Oxford White Shirt", cat: "men", categoryId: "c3", price: 4490, sale: 3590, imgs: [9, 10, 2], colors: [["White", "#FFFFFF"], ["Sky", "#BFD6EA"]], material: "100% cotton Oxford", flags: { bestSeller: true }, tags: ["shirt", "formal"], rating: 4.7, reviews: 302, sold: 1240, daysAgo: 90 },
  { name: "Zain Waxed Field Jacket", cat: "men", categoryId: "c3", price: 12990, imgs: [7, 5, 6], colors: [["Olive", "#4E5A3A"]], material: "Waxed cotton", tags: ["jacket", "outerwear"], rating: 4.4, reviews: 16, sold: 44, daysAgo: 35, lowStock: true },
  { name: "Everyday Supima Crew Tee", cat: "basics", categoryId: "c4", price: 1990, sale: 1490, imgs: [0, 4, 3], colors: [["White", "#FFFFFF"], ["Black", "#141414"], ["Heather", "#BFC3C9"]], material: "Supima cotton jersey", flags: { bestSeller: true }, tags: ["tee", "essential"], rating: 4.8, reviews: 512, sold: 2300, daysAgo: 120 },
  { name: "Heritage Graphic Tee", cat: "basics", categoryId: "c4", price: 2490, imgs: [1, 7, 0], colors: [["Stone", "#E8E1D3"]], material: "Organic cotton", flags: { newArrival: true }, tags: ["tee", "graphic"], rating: 4.3, reviews: 41, sold: 150, daysAgo: 7 },
  { name: "Chambray Dot Shirt", cat: "basics", categoryId: "c4", price: 3490, sale: 2790, imgs: [2, 6, 8], colors: [["Chambray", "#6E8FB5"]], material: "Cotton chambray", tags: ["shirt", "casual"], rating: 4.4, reviews: 58, sold: 210, daysAgo: 45 },
  { name: "Selvedge Straight Jeans", cat: "basics", categoryId: "c4", price: 5990, imgs: [8, 6, 7], colors: [["Indigo", "#26324F"], ["Black", "#1C1C1C"]], sizes: ["28", "30", "32", "34", "36"], material: "13oz selvedge denim", flags: { featured: true }, tags: ["denim", "jeans"], rating: 4.6, reviews: 97, sold: 330, daysAgo: 22 },
  { name: "Rust Bomber Jacket", cat: "basics", categoryId: "c4", price: 6990, sale: 4890, imgs: [9, 3, 1], colors: [["Rust", "#B5643A"]], material: "Nylon shell, quilted lining", tags: ["jacket"], rating: 4.5, reviews: 39, sold: 140, daysAgo: 60 },
  { name: "Little Gent Cardigan Set", cat: "kids", categoryId: "c5", price: 3990, imgs: [1, 0, 2], colors: [["Navy", "#1E2A4A"]], sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"], material: "Soft cotton knit", flags: { newArrival: true }, tags: ["kids", "knit"], rating: 4.7, reviews: 23, sold: 90, daysAgo: 8 },
  { name: "Playday Tee & Shorts", cat: "kids", categoryId: "c5", price: 2490, sale: 1990, imgs: [0, 2, 1], colors: [["Sand", "#E7DCC8"], ["Sky", "#BFD6EA"]], sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"], material: "Cotton jersey", flags: { bestSeller: true }, tags: ["kids", "summer"], rating: 4.6, reviews: 45, sold: 260, daysAgo: 28 },
];

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];
const DAY = 86_400_000;
// fixed reference so server and client render identical data
const NOW = Date.UTC(2026, 10, 12);

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export const DUMMY_PRODUCTS: Product[] = SEEDS.map((s, i) => {
  const sizes = s.sizes ?? DEFAULT_SIZES;
  const variants = sizes.flatMap((size) =>
    s.colors.map(([color]) => {
      const h = hash(`${s.name}${size}${color}`);
      const stock = s.lowStock ? h % 3 : h % 7 === 0 ? 0 : 3 + (h % 18);
      return { size, color, stock };
    }),
  );
  const pool = IMG[s.cat];
  const images = s.imgs.map((idx, order) => ({ url: u(pool[idx % pool.length]), publicId: "", order, alt: `${s.name} — view ${order + 1}` }));
  const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const cat = DUMMY_CATEGORIES.find((c) => c.id === s.categoryId)!;
  return {
    id: `p${i + 1}`,
    name: s.name,
    slug,
    description: `<p>Crafted for the modern wardrobe, the <strong>${s.name}</strong> pairs timeless tailoring with an easy, contemporary silhouette. Finished by hand in our Lahore atelier with meticulous attention to detail.</p><ul><li>${s.material}</li><li>Relaxed, flattering fit</li><li>Breathable and comfortable all day</li></ul>`,
    categoryId: s.categoryId,
    categorySlug: cat.slug,
    tags: s.tags,
    price: s.price,
    salePrice: s.sale ?? null,
    sku: `AH-${cat.slug.slice(0, 2).toUpperCase()}-${String(1001 + i)}`,
    sizes,
    colors: s.colors.map(([name, hex]) => ({ name, hex })),
    variants,
    totalStock: variants.reduce((a, v) => a + v.stock, 0),
    images,
    weight: 0.5,
    material: s.material,
    care: "Gentle hand wash in cold water. Do not bleach. Iron on low heat. Dry in shade.",
    active: true,
    featured: !!s.flags?.featured,
    newArrival: !!s.flags?.newArrival,
    bestSeller: !!s.flags?.bestSeller,
    rating: s.rating,
    reviewCount: s.reviews,
    soldCount: s.sold,
    createdAt: NOW - s.daysAgo * DAY,
  };
});

/** Demo-only cost prices (admin side). Never imported by storefront code. */
export const DUMMY_COST_RATIO = 0.55;

const REVIEW_SEEDS: [string, number, string, string][] = [
  ["Ayesha K.", 5, "Absolutely stunning", "The fabric quality is beyond what I expected for the price. Stitching is neat and the colour is exactly as shown. Got so many compliments at my cousin's mehndi!"],
  ["Hira S.", 5, "Fast delivery to Karachi", "Ordered on Monday, received on Wednesday with COD. Packaging felt premium, like opening a gift."],
  ["Usman R.", 4, "Great fit", "Fits true to size. I'm 5'10 and medium was perfect. Would love more colour options."],
  ["Mahnoor A.", 5, "My new favourite brand", "Exchange process was super easy when I needed a different size. Team was very polite on WhatsApp."],
  ["Bilal T.", 5, "Worth every rupee", "The suit looks far more expensive than it is. Wore it to a wedding in Islamabad and it held up all night."],
  ["Fatima Z.", 4, "Elegant and comfortable", "Soft fabric, breathable in Lahore heat. The dupatta is gorgeous."],
];

export const DUMMY_REVIEWS: Review[] = DUMMY_PRODUCTS.flatMap((p, pi) =>
  REVIEW_SEEDS.slice(0, 3 + (pi % 4)).map(([userName, rating, title, body], ri) => ({
    id: `r${pi}-${ri}`,
    productId: p.id,
    userId: `u${ri}`,
    userName,
    rating,
    title,
    body,
    verified: ri % 3 !== 2,
    status: "approved" as const,
    createdAt: NOW - (ri + 1) * 4 * DAY - pi * DAY,
  })),
);

export const HOME_TESTIMONIALS = REVIEW_SEEDS.map(([name, rating, title, body], i) => ({
  id: `t${i}`,
  name,
  rating,
  title,
  body,
  city: ["Lahore", "Karachi", "Rawalpindi", "Islamabad", "Islamabad", "Multan"][i],
}));

export const DUMMY_SETTINGS: StoreSettings = {
  storeName: "AH Clothing Hub",
  tagline: "Modern heritage, made in Pakistan",
  logo: null,
  favicon: null,
  phone: "+92 300 1234567",
  whatsapp: "+923001234567",
  email: "hello@ahclothinghub.pk",
  address: "Shop 12, MM Alam Road, Gulberg III, Lahore",
  socials: { instagram: "https://instagram.com", facebook: "https://facebook.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com" },
  deliveryCharge: 250,
  freeDeliveryThreshold: 5000,
  citiesServed: [],
  profitCountsStatuses: ["delivered"],
  payments: {
    cod: { enabled: true },
    jazzcash: { enabled: true, accountTitle: "AH Clothing Hub", accountNumber: "0300 1234567" },
    easypaisa: { enabled: true, accountTitle: "AH Clothing Hub", accountNumber: "0345 7654321" },
  },
  announcement: [
    "Free delivery on orders above Rs. 5,000",
    "Cash on Delivery available nationwide",
    "Easy 7-day exchange & returns",
    "New Winter Edit — now live",
  ],
  heroBanners: [
    { id: "h1", image: u(IMG.eastern[0]), eyebrow: "Winter Festive '26", title: "Grace, woven by hand", subtitle: "Embroidered lawn and silk pieces for every celebration of the season.", ctaLabel: "Shop Women Eastern", ctaLink: "/category/women-eastern", order: 1 },
    { id: "h2", image: u(IMG.lifestyle[0]), eyebrow: "The Neutral Edit", title: "Quiet luxury, everyday", subtitle: "Soft knits, crisp linens and timeless layers in a palette of sand and stone.", ctaLabel: "Explore New Arrivals", ctaLink: "/shop?filter=new", order: 2 },
    { id: "h3", image: u(IMG.men[2]), eyebrow: "Menswear", title: "Tailored to command", subtitle: "Sharp suits, blazers and overshirts cut for the modern Pakistani man.", ctaLabel: "Shop Men", ctaLink: "/category/men", order: 3 },
  ],
  templates: {
    whatsapp: {
      pending: "Assalam o Alaikum {name}! Thank you for your order {orderNumber} of {total} at AH Clothing Hub. We will confirm it shortly.",
      confirmed: "Hi {name}, your order {orderNumber} has been confirmed ✅ We are preparing it for dispatch.",
      shipped: "Hi {name}, your order {orderNumber} has been shipped via {courier}. Tracking: {tracking} 🚚",
      delivered: "Hi {name}, your order {orderNumber} has been delivered. We hope you love it! ❤️",
      cancelled: "Hi {name}, your order {orderNumber} has been cancelled. Reply here if you have any questions.",
    },
    email: {},
  },
};

export const DUMMY_PAGES: PagesContent = {
  about: `<p>AH Clothing Hub was born in Lahore with a simple belief: that heritage craft and modern design belong together. Every piece we make starts with fabric chosen by hand, patterns drawn in-house, and finishing done by artisans we know by name.</p><p>We design for real life in Pakistan — the heat of a Karachi afternoon, the chill of an Islamabad evening, and every wedding, Eid and dinner in between.</p>`,
  returns: `<h3>7-day easy exchange & returns</h3><p>Not quite right? You can exchange or return unworn items with original tags within 7 days of delivery.</p><ul><li>Message us on WhatsApp or email with your order number.</li><li>We arrange a pickup in major cities, or you can courier it back.</li><li>Refunds are processed within 5–7 working days to your bank account, JazzCash or EasyPaisa.</li></ul><p>Sale items are eligible for exchange only. Bridal and customised pieces are final sale.</p>`,
  privacy: `<p>We respect your privacy. We collect only the information required to process your orders and improve your experience — your name, contact details and delivery address. We never sell your data. Payments are handled securely and we never store card details.</p>`,
  terms: `<p>By using this website you agree to our terms. Prices are listed in Pakistani Rupees (PKR) and include all applicable taxes. We reserve the right to cancel orders in case of pricing errors or stock unavailability, in which case any payment made will be refunded in full.</p>`,
  faq: [
    { q: "How long does delivery take?", a: "Orders are delivered within 2–4 working days in major cities and 4–6 working days elsewhere in Pakistan." },
    { q: "Do you offer Cash on Delivery?", a: "Yes! Cash on Delivery is available nationwide. You can also pay via JazzCash or EasyPaisa." },
    { q: "How much is delivery?", a: "Delivery is Rs. 250 flat, and free on orders above Rs. 5,000." },
    { q: "Can I exchange a size?", a: "Absolutely. Exchanges are free within 7 days of delivery — just message us on WhatsApp." },
    { q: "How do I track my order?", a: "Log in and open My Orders to see a live status timeline and your courier tracking number." },
    { q: "Are colours true to the pictures?", a: "We shoot in natural light to keep colours accurate, but slight variation may occur due to screen settings." },
  ],
};
