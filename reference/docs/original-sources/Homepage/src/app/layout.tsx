import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "מדלן - לוח נדל״ן | דירות למכירה ולהשכרה",
  description: "לוח נדל״ן של מדלן המתעדכן מידי יום. דירות למכירה, דירות להשכרה, פרויקטים חדשים ונכסים מסחריים בכל רחבי הארץ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${inter.variable} ${rubik.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
