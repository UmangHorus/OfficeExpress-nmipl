"use client";
import { Roboto } from "next/font/google";
import "@/app/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./Providers";
import { metadata } from "./metadata";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={roboto.className} suppressHydrationWarning>
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {process.env.NEXT_PUBLIC_API_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        )}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}