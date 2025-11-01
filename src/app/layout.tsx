import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Neon Binaural Studio",
  applicationName: "Neon Binaural Studio",
  description: "Immersive binaural beats studio designed for focus, calm, and deep work.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/nbs-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/nbs-icon-maskable.svg" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/nbs-icon-maskable.svg" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Neon Binaural",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} font-sans antialiased`}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
