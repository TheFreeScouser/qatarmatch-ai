import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QatarMatch AI",
  description: "Natural language property matching for Qatar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
