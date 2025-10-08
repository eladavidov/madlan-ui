"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Heart, Plus } from "lucide-react";
import Image from "next/image";

export default function Header() {

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="https://ext.same-assets.com/3745260647/4099482171.svg"
              alt="מדלן"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-medium">
                  דירות למכירה <ChevronDown className="mr-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem>תל אביב יפו</DropdownMenuItem>
                <DropdownMenuItem>ירושלים</DropdownMenuItem>
                <DropdownMenuItem>חיפה</DropdownMenuItem>
                <DropdownMenuItem>ראשון לציון</DropdownMenuItem>
                <DropdownMenuItem>פתח תקווה</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-medium">
                  דירות להשכרה <ChevronDown className="mr-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem>תל אביב יפו</DropdownMenuItem>
                <DropdownMenuItem>ירושלים</DropdownMenuItem>
                <DropdownMenuItem>חיפה</DropdownMenuItem>
                <DropdownMenuItem>רמת גן</DropdownMenuItem>
                <DropdownMenuItem>הוד השרון</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-medium">
                  פרויקטים חדשים <ChevronDown className="mr-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem>תל אביב</DropdownMenuItem>
                <DropdownMenuItem>רמת גן</DropdownMenuItem>
                <DropdownMenuItem>רמת השרון</DropdownMenuItem>
                <DropdownMenuItem>הרצליה</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/commercial">
              <Button variant="ghost" className="font-medium">
                מסחרי
              </Button>
            </Link>

            <Link href="/madad">
              <Button variant="ghost" className="font-medium">
                מדד תשואות
              </Button>
            </Link>

            <Link href="/blog">
              <Button variant="ghost" className="font-medium">
                כתבות ומדריכים
              </Button>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Heart className="h-5 w-5" />
            </Button>

            <Button className="hidden md:flex gradient-primary text-white">
              <Plus className="h-4 w-4 ml-2" />
              פרסום מודעה
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>כניסה</DropdownMenuItem>
                <DropdownMenuItem>הרשמה</DropdownMenuItem>
                <DropdownMenuItem>המודעות שלי</DropdownMenuItem>
                <DropdownMenuItem>חיפושים שמורים</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
