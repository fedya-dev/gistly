import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: "Gistly — Share code snippets",
    template: "%s · Gistly",
  },
  description:
    "Beautiful, self-hosted code snippet sharing. Syntax highlighted, instantly linkable, entirely yours. / Споделяй код снипети красиво — на твоя сървър.",
  keywords: [
    "gist",
    "pastebin",
    "code snippets",
    "self-hosted",
    "opengist alternative",
    "syntax highlighting",
  ],
  applicationName: "Gistly",
  authors: [{ name: "Gistly" }],
  openGraph: {
    title: "Gistly — Share code snippets",
    description: "Beautiful, self-hosted code snippet sharing.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
