import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PROGRAM_NAME, PROGRAM_NAME_NAV } from "@/lib/branding";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: `JTSG ${PROGRAM_NAME_NAV} | Joshua Tree Service Group`,
  description: `Partner with Joshua Tree Service Group through the ${PROGRAM_NAME}. Connect with qualified job seekers in Georgia.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
