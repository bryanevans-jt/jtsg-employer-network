import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JTSG Employer Network | Joshua Tree Service Group",
  description:
    "Join the Joshua Tree Service Group employer network. Partner with us to connect with qualified job seekers in Georgia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
