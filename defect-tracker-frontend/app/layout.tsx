import type { Metadata } from "next";
// Fonts are bundled with the app (no request to a font service at build or run time).
import { GeistSans } from "geist/font/sans";
import "@fontsource-variable/newsreader";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";

export const metadata: Metadata = {
  title: "Centa Arıza Takip Sistemi",
  description: "Centa Arıza Takip Sistemi",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico'
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={GeistSans.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className="antialiased"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
