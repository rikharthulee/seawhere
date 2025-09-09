import "./globals.css";
import Navbar from "../components/Navbar";
import GygAnalytics from "@/components/GygAnalytics";
import { Playfair_Display } from "next/font/google";
import Script from "next/script";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "JapanMan",
  description: "Tailor-made Japan travel experiences",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* GetYourGuide Analytics */}
        <Script
          src="https://widget.getyourguide.com/dist/pa.umd.production.min.js"
          strategy="afterInteractive"
          data-gyg-partner-id="WVS8AHI"
        />
      </head>
      <body className={playfair.className}>
        <Navbar />
        <div className="antialiased bg-white text-neutral-900">{children}</div>
        <GygAnalytics />
      </body>
    </html>
  );
}
