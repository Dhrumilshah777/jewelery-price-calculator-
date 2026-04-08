import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amit Ornaments — Jewellery Price Calculator",
  description:
    "Calculate gold jewellery prices for 22kt, 18kt, and 24kt with live-style rates.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/ao-logo.jpg", type: "image/jpeg", sizes: "512x512" }],
    apple: [{ url: "/ao-logo.jpg", type: "image/jpeg", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Amit Ornaments Calculator",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
