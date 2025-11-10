import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import "./globals.css";

const baloo2 = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Brain",
  applicationName: "Brain",
  description: "Brain blends binaural beats, focus rituals, and streak tracking into one installable studio.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/brain-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/brain-icon-maskable.svg" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/brain-icon-maskable.svg", color: "#00D1FF" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Brain",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${baloo2.variable} font-sans antialiased`}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
