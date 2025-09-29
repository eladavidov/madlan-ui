import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { ClientBody } from "./ClientBody";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rubik"
});

export const metadata: Metadata = {
  title: "דירות למכירה בחיפה - 4,719 דירות מחכות לך | מדלן",
  description: "היכנסו ללוח הנדל\"ן של מדלן, המתעדכן מידי יום, ל-3755 דירות למכירה, המחכות לך בחיפה",
  icons: {
    icon: "https://ext.same-assets.com/3745260647/3776348977.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <ClientBody>{children}</ClientBody>
    </html>
  );
}
