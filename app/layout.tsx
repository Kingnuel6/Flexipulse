import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlexiPulse — KPI Intelligence Platform",
  description: "Real-time visibility into organizational performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
