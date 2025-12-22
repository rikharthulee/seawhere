import "./globals.css";
import Navbar from "../components/Navbar";
import GygAnalytics from "@/components/GygAnalytics";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Seawhere",
  description: "Southeast Asia travel, curated for independent explorers",
  icons: {
    icon: "/favicon.ico",
  },
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>{/* GYG widget script is loaded where used (GygWidget) */}</head>
      <body className="font-sans">
        <Navbar />
        <div className="site-root antialiased bg-background text-foreground">{children}</div>
        <Footer />
        <Suspense fallback={null}>
          <GygAnalytics />
        </Suspense>
        <SpeedInsights />;
      </body>
    </html>
  );
}
