import React from 'react'
import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <svg width="100" height="36" viewBox="0 0 100 36" className="fill-current text-white">
                <path d="M0 0h100v36H0z" fill="none"/>
                <text x="10" y="26" fontSize="26" fontWeight="bold" fill="white">מדלן</text>
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              מדלן - פורטל הנדל״ן המוביל בישראל
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">פירוט תפריט</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/sale" className="text-gray-400 hover:text-white">דירות למכירה</Link></li>
              <li><Link href="/rent" className="text-gray-400 hover:text-white">דירות להשכרה</Link></li>
              <li><Link href="/projects" className="text-gray-400 hover:text-white">פרויקטים חדשים</Link></li>
              <li><Link href="/commercial" className="text-gray-400 hover:text-white">נדל״ן מסחרי</Link></li>
              <li><Link href="/agents" className="text-gray-400 hover:text-white">דירות מתיווך</Link></li>
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h3 className="font-semibold mb-4">דירות במיקומים שווים</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tel-aviv" className="text-gray-400 hover:text-white">דירות למכירה בתל אביב</Link></li>
              <li><Link href="/jerusalem" className="text-gray-400 hover:text-white">דירות למכירה בירושלים</Link></li>
              <li><Link href="/haifa" className="text-gray-400 hover:text-white">דירות למכירה בחיפה</Link></li>
              <li><Link href="/rishon" className="text-gray-400 hover:text-white">דירות למכירה בראשון לציון</Link></li>
              <li><Link href="/netanya" className="text-gray-400 hover:text-white">דירות למכירה בנתניה</Link></li>
            </ul>
          </div>

          {/* More Links */}
          <div>
            <h3 className="font-semibold mb-4">מידע נוסף</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-gray-400 hover:text-white">אודות מדלן</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white">צור קשר</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">תנאי שימוש</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">מדיניות פרטיות</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-white">דרושים</Link></li>
            </ul>
          </div>

          {/* Contact and Social */}
          <div>
            <h3 className="font-semibold mb-4">מוקדים ופרטיות נוספים</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>דירות למכירה בישראל</li>
              <li>דירות להשכרה בישראל</li>
              <li>יועצי משכנתאות</li>
              <li>עורכי דין לנדל״ן</li>
              <li>שמאי מקרקעין</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © 2024 מדלן | כל הזכויות שמורות
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white">תנאי שימוש</Link>
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">מדיניות פרטיות</Link>
            <Link href="/accessibility" className="text-sm text-gray-400 hover:text-white">נגישות</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
