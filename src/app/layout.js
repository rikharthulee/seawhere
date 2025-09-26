import "./globals.css";
import Navbar from "../components/Navbar";
import GygAnalytics from "@/components/GygAnalytics";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Ancizar_Serif } from "next/font/google";

const ancizarSerif = Ancizar_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "JapanMan",
  description: "Tailor-made Japan travel experiences",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const supabaseAssetsUrl = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_URL || null;
  let preconnects = [];
  try {
    if (supabaseUrl) preconnects.push(new URL(supabaseUrl).origin);
  } catch {}
  try {
    if (supabaseAssetsUrl) preconnects.push(new URL(supabaseAssetsUrl).origin);
  } catch {}
  // Deduplicate origins to avoid duplicate React keys
  preconnects = Array.from(new Set(preconnects.filter(Boolean)));
  return (
    <html lang="en">
      <head>
        {/* GYG widget script is now loaded only where used (GygWidget) */}
        {preconnects.map((href) => (
          <link
            key={`${href}-pc`}
            rel="preconnect"
            href={href}
            crossOrigin=""
          />
        ))}
        {preconnects.map((href) => (
          <link key={`${href}-dns`} rel="dns-prefetch" href={href} />
        ))}
      </head>
      <body className={ancizarSerif.className}>
        <Navbar />
        <div className="site-root antialiased bg-background text-foreground">{children}</div>
        <Suspense fallback={null}>
          <GygAnalytics />
        </Suspense>
        <SpeedInsights />;
      </body>
    </html>
  );
}
