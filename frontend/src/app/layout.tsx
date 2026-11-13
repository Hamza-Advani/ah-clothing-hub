import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { SplashScreen } from "@/components/store/splash-screen";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const description =
  "AH Clothing Hub (AH Clothing) — Pakistan's online clothing store for women, men and kids. Shop eastern and western wear, lawn, kurtas and more with Cash on Delivery across Pakistan.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AH Clothing Hub | AH Clothing — Online Clothing Store in Pakistan", template: "%s | AH Clothing Hub" },
  description,
  applicationName: "AH Clothing Hub",
  keywords: [
    "AH Clothing Hub", "AH Clothing", "AH Clothing Hub Pakistan", "AH clothes", "AH Hub", "AH", "ahclothinghub",
    "online clothing store Pakistan", "Pakistani clothing", "eastern wear", "western wear", "lawn suits", "kurta", "online shopping Pakistan", "cash on delivery clothes",
  ],
  authors: [{ name: "AH Clothing Hub" }],
  creator: "AH Clothing Hub",
  publisher: "AH Clothing Hub",
  category: "fashion",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    siteName: "AH Clothing Hub",
    title: "AH Clothing Hub — Online Clothing Store in Pakistan",
    description,
    url: "/",
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image", title: "AH Clothing Hub", description },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
};

/** Brand structured data — helps Google show "AH Clothing Hub" as the site name and a sitelinks search box. */
const brandJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AH Clothing Hub",
    alternateName: ["AH Clothing", "AH Clothing Hub Pakistan", "AH"],
    url: siteUrl,
    potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/shop?q={search_term_string}` }, "query-input": "required name=search_term_string" },
  },
  {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: "AH Clothing Hub",
    alternateName: "AH Clothing",
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    image: `${siteUrl}/opengraph-image`,
    description,
    areaServed: { "@type": "Country", name: "Pakistan" },
    currenciesAccepted: "PKR",
    paymentAccepted: "Cash on Delivery, JazzCash, EasyPaisa",
  },
];
// static data only (no user input), so plain JSON is safe inside the script tag
const jsonLdString = JSON.stringify(brandJsonLd);

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Skip the intro splash if it was already shown in this browser session */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('ah-splash')||location.pathname.startsWith('/admin')){document.documentElement.classList.add('splash-seen')}else{sessionStorage.setItem('ah-splash','1')}if(location.pathname.startsWith('/admin')){var t=localStorage.getItem('ah-admin-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
      </head>
      <body className="min-h-dvh">
        <SplashScreen />
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-md !border-0 !bg-[#141414] !text-[#faf7f2] !shadow-lift !font-sans",
              description: "!text-[#c9c2b8]",
              actionButton: "!bg-[#b08d57] !text-white",
            },
          }}
        />
      </body>
    </html>
  );
}
