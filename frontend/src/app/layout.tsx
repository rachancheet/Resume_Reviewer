import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Review Platform",
  description: "Upload and review resumes with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {children}
      </body>
    </html>
  );
}