import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/primitives/ThemeProvider";
import { LayoutProvider } from "@/components/primitives/LayoutProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reader - Paper Reading Tool",
  description: "Read papers with AI assistance and save structured notes to Obsidian",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden`}
      >
        <ThemeProvider>
          <LayoutProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
