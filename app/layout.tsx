import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Test Case Generator - AI Powered",
  description: "Generate test cases from requirements using AI",
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
      >
        {children}



                        {/* ✅ Botpress Webchat Scripts */}
                <Script src="https://cdn.botpress.cloud/webchat/v3.3/inject.js" />
                <Script
                  src="https://files.bpcontent.cloud/2025/09/25/10/20250925105129-8PNQ2MNV.js"
                  strategy="afterInteractive"
                />
      </body>
    </html>
  );
}
