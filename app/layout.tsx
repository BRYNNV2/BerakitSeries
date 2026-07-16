import type { Metadata } from "next";
import { Inter, Geist_Mono, Oswald } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import DomSafetyPatch from "@/components/dom-safety-patch";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "block",
});

export const metadata: Metadata = {
  title: "BERAKIT SERIES",
  description: "BUMDES Desa Berakit - Elevate Your Style in Every Reality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} ${oswald.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <DomSafetyPatch />
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
