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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AH Clothing Hub — Modern Heritage Fashion in Pakistan", template: "%s | AH Clothing Hub" },
  description:
    "Shop premium eastern and western wear for women, men and kids. Cash on Delivery across Pakistan, free delivery over Rs. 5,000 and easy 7-day exchanges.",
  keywords: ["Pakistani clothing", "lawn suits", "kurta", "eastern wear", "western wear", "online shopping Pakistan", "AH Clothing Hub"],
  openGraph: {
    type: "website",
    siteName: "AH Clothing Hub",
    locale: "en_PK",
  },
  twitter: { card: "summary_large_image" },
};

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
