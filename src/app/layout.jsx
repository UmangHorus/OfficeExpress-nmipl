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
  const newWebsiteUrl = "https://nmipl.hofficeexpress.com";
  const currentUrl = "https://nmipl.corpteaser.net";

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

        <div className="text-center p-5 font-sans bg-blue-50 min-h-screen flex flex-col justify-center items-center">
          <div className="bg-white p-10 rounded-xl shadow-xl max-w-xl w-[90%]">
            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-blue-800 mb-4">
                We've Moved to a New Platform!
              </h1>
              <div className="h-1 w-16 bg-blue-400 mx-auto rounded-sm"></div>
            </div>

            {/* Info text */}
            <p className="text-gray-700 text-lg leading-relaxed mb-3">
              The application at{" "}
              <strong>{currentUrl}</strong> has been moved to:
            </p>

            {/* New URL Box */}
            <div className="bg-blue-50 p-4 rounded-lg my-5 border border-dashed border-blue-300">
              <a
                href={newWebsiteUrl}
                className="text-blue-700 font-bold text-xl break-words hover:underline"
              >
                {newWebsiteUrl || "Loading..."}
              </a>
            </div>

            {/* Subtitle */}
            <p className="text-gray-500 my-6 text-base">
              Click the button below to continue to the new platform.
            </p>

            {/* Button */}
            <div className="mt-8">
              <button
                onClick={() => (window.location.href = newWebsiteUrl)}
                className="px-8 py-3 bg-blue-500 text-white rounded-md font-semibold text-base shadow-md hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transform transition-all duration-300"
              >
                Continue to New Platform
              </button>
            </div>
          </div>
        </div>
        {/* <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers> */}
      </body>
    </html>
  );
}