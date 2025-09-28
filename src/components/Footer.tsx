import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-20">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* מידע */}
          <div>
            <h4 className="font-semibold mb-4">מידע</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white text-sm transition-colors">
                  פרטים לרישוי
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">
                  פרטים למחוברים
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="text-slate-400 hover:text-white text-sm transition-colors">
                  חברות נדל״ן בארצות קליימים
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="text-slate-400 hover:text-white text-sm transition-colors">
                  חברות נדל״ן מקצועיות
                </Link>
              </li>
              <li>
                <Link href="/policy" className="text-slate-400 hover:text-white text-sm transition-colors">
                  להתחברים
                </Link>
              </li>
            </ul>
          </div>

          {/* כללי */}
          <div>
            <h4 className="font-semibold mb-4">כללי</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-slate-400 hover:text-white text-sm transition-colors">
                  בלוג מדלן
                </Link>
              </li>
              <li>
                <Link href="/commercial" className="text-slate-400 hover:text-white text-sm transition-colors">
                  חיווך זמפת המיג״ג
                </Link>
              </li>
              <li>
                <Link href="/insurance" className="text-slate-400 hover:text-white text-sm transition-colors">
                  איטקט יומי
                </Link>
              </li>
              <li>
                <Link href="/associations" className="text-slate-400 hover:text-white text-sm transition-colors">
                  מאמר המתוכנים
                </Link>
              </li>
              <li>
                <Link href="/madad-2025" className="text-slate-400 hover:text-white text-sm transition-colors">
                  מדד המתוכנים 2024/25
                </Link>
              </li>
              <li>
                <Link href="/madad-2024" className="text-slate-400 hover:text-white text-sm transition-colors">
                  מדד המתוכנים 2023/24
                </Link>
              </li>
            </ul>
          </div>

          {/* שכונות */}
          <div>
            <h4 className="font-semibold mb-4">שכונות</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/neighborhoods/tel-aviv" className="text-slate-400 hover:text-white text-sm transition-colors">
                  מפת הנדל״ן של ישראל
                </Link>
              </li>
              <li>
                <Link href="/neighborhoods/jerusalem" className="text-slate-400 hover:text-white text-sm transition-colors">
                  שכונות בתל אביב
                </Link>
              </li>
              <li>
                <Link href="/neighborhoods/haifa" className="text-slate-400 hover:text-white text-sm transition-colors">
                  שכונות בירושלים
                </Link>
              </li>
              <li>
                <Link href="/neighborhoods/netanya" className="text-slate-400 hover:text-white text-sm transition-colors">
                  שכונות בחיפה
                </Link>
              </li>
              <li>
                <Link href="/neighborhoods/ramat-gan" className="text-slate-400 hover:text-white text-sm transition-colors">
                  שכונות ברמת גן
                </Link>
              </li>
            </ul>
          </div>

          {/* דירות להשכרה */}
          <div>
            <h4 className="font-semibold mb-4">דירות להשכרה</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/rent/tel-aviv" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות להשכרה בתל אביב
                </Link>
              </li>
              <li>
                <Link href="/rent/jerusalem" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות להשכרה בירושלים
                </Link>
              </li>
              <li>
                <Link href="/rent/haifa" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות להשכרה בחיפה
                </Link>
              </li>
              <li>
                <Link href="/rent/beer-sheva" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות להשכרה בבאר שבע
                </Link>
              </li>
              <li>
                <Link href="/rent/netanya" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות להשכרה בנתניה
                </Link>
              </li>
              <li>
                <Link href="/rent/ramat-gan" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות להשכרה ברמת גן
                </Link>
              </li>
            </ul>
          </div>

          {/* דירות למכירה */}
          <div>
            <h4 className="font-semibold mb-4">דירות למכירה</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/sale/tel-aviv" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות למכירה בתל אביב
                </Link>
              </li>
              <li>
                <Link href="/sale/jerusalem" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות למכירה בירושלים
                </Link>
              </li>
              <li>
                <Link href="/sale/haifa" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות למכירה בחיפה
                </Link>
              </li>
              <li>
                <Link href="/sale/beer-sheva" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות למכירה בבאר שבע
                </Link>
              </li>
              <li>
                <Link href="/sale/ramat-gan" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות למכירה ברמת גן
                </Link>
              </li>
              <li>
                <Link href="/sale/herzliya" className="text-slate-400 hover:text-white text-sm transition-colors">
                  דירות למכירה בהרצליה
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-3 mt-8 pt-8 border-t border-slate-800">
          <Button size="icon" variant="ghost" className="hover:bg-slate-800">
            <Facebook className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="hover:bg-slate-800">
            <Twitter className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="hover:bg-slate-800">
            <Instagram className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="hover:bg-slate-800">
            <Linkedin className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              מדלן 2025 ©
            </p>
            <div className="flex gap-6">
              <Link href="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">
                תנאי שימוש
              </Link>
              <Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">
                מפת האתר
              </Link>
              <Link href="/accessibility" className="text-slate-400 hover:text-white text-sm transition-colors">
                הצהרת נגישות
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
