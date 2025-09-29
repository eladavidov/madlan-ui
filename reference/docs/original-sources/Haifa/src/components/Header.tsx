"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, User, Heart, Search, Plus } from 'lucide-react'

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg width="90" height="32" viewBox="0 0 90 32" className="fill-current madlan-green">
              <path d="M0 0h90v32H0z" fill="none"/>
              <text x="10" y="24" fontSize="24" fontWeight="bold" fill="#52c41a">מדלן</text>
            </svg>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
              דירות למכירה
            </Link>
            <Link href="/projects" className="text-gray-700 hover:text-gray-900 font-medium">
              פרויקטים חדשים
            </Link>
            <Link href="/rent" className="text-gray-700 hover:text-gray-900 font-medium">
              דירות להשכרה
            </Link>
            <Link href="/commercial" className="text-gray-700 hover:text-gray-900 font-medium">
              נדל״ן מסחרי
            </Link>
            <Link href="/agents" className="text-gray-700 hover:text-gray-900 font-medium">
              מתווכים
            </Link>
            <Link href="/mortgage" className="text-gray-700 hover:text-gray-900 font-medium">
              משכנתאות
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-gray-900 font-medium">
              מגזין
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 madlan-green-bg text-white rounded-lg hover:opacity-90 transition">
              <Plus className="h-4 w-4" />
              <span>פרסום מודעה</span>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <Heart className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <User className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
                דירות למכירה
              </Link>
              <Link href="/projects" className="text-gray-700 hover:text-gray-900 font-medium">
                פרויקטים חדשים
              </Link>
              <Link href="/rent" className="text-gray-700 hover:text-gray-900 font-medium">
                דירות להשכרה
              </Link>
              <Link href="/commercial" className="text-gray-700 hover:text-gray-900 font-medium">
                נדל״ן מסחרי
              </Link>
              <Link href="/agents" className="text-gray-700 hover:text-gray-900 font-medium">
                מתווכים
              </Link>
              <Link href="/mortgage" className="text-gray-700 hover:text-gray-900 font-medium">
                משכנתאות
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-gray-900 font-medium">
                מגזין
              </Link>
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 madlan-green-bg text-white rounded-lg hover:opacity-90 transition">
                <Plus className="h-4 w-4" />
                <span>פרסום מודעה</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
