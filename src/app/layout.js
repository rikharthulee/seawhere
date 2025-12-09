import "./globals.css";
import Navbar from "../components/Navbar";
import GygAnalytics from "@/components/GygAnalytics";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "Seawhere",
  description: "Southeast Asia travel, curated for independent explorers",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>{/* GYG widget script is loaded where used (GygWidget) */}</head>
      <body>
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
