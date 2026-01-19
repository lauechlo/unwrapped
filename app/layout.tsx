import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unwrapped - Your Spotify Listening DNA",
  description: "Spotify shows what you listen to. We show who you are. Get psychology-driven insights about your music habits + Instagram-ready shareable cards.",
  keywords: ["spotify", "unwrapped", "spotify wrapped", "music analysis", "listening habits", "psychology", "AI insights", "shareable cards"],
  authors: [{ name: "Chloe" }],
  creator: "Chloe",

  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://unwrapped.fm",
    siteName: "Unwrapped",
    title: "Unwrapped - Your Spotify Listening DNA",
    description: "Get psychology-driven insights about your Spotify listening habits. AI-powered analysis + Instagram Stories-ready cards.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Unwrapped - Spotify Listening Analysis",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Unwrapped - Your Spotify Listening DNA",
    description: "Get psychology-driven insights about your Spotify listening habits. AI-powered analysis + shareable cards.",
    images: ["/og-image.png"],
    creator: "@unwrappedapp",
  },

  // Additional meta
  metadataBase: new URL("https://unwrapped.fm"),
  alternates: {
    canonical: "https://unwrapped.fm",
  },

  // Theme colors
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],

  // Viewport
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
