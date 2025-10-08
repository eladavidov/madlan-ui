"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, MessageCircle } from "lucide-react";
import Image from "next/image";

interface HeroSectionProps {
  onChatToggle: () => void;
  isChatOpen: boolean;
}

export default function HeroSection({ onChatToggle, isChatOpen }: HeroSectionProps) {
  const [searchType, setSearchType] = useState("buy");
  const [location, setLocation] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (location.trim()) {
      router.push(`/search-results?location=${encodeURIComponent(location)}&type=${searchType}`);
    } else {
      router.push(`/search-results?type=${searchType}`);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="gradient-hero min-h-[350px] relative">
        {/* Background Elements */}
        <div className="absolute inset-0">
          {/* Building illustration on left */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20">
            <Image
              src="https://ext.same-assets.com/3745260647/2997790629.false"
              alt=""
              width={200}
              height={300}
              className="h-[300px] w-auto"
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
              מדלן. הלוח של הקונים.
            </h1>

            {/* Search Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-5 md:p-6">
              {/* Tabs */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setSearchType("buy")}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      searchType === "buy"
                        ? "bg-white text-gray-900 shadow"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    למכירה / רכישה
                  </button>
                  <button
                    onClick={() => setSearchType("rent")}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      searchType === "rent"
                        ? "bg-white text-gray-900 shadow"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    להשכרה
                  </button>
                  <button
                    onClick={() => setSearchType("commercial")}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      searchType === "commercial"
                        ? "bg-white text-gray-900 shadow"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    מסחרי
                  </button>
                </div>
              </div>

              {/* Search Form */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="הכניסו עיר, שכונה או כתובת"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pr-10 h-12 text-base"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSearch}
                    className="h-12 px-8 gradient-primary text-white font-semibold"
                  >
                    <Search className="h-5 w-5 ml-2" />
                    חיפוש
                  </Button>
                  <Button
                    onClick={onChatToggle}
                    variant={isChatOpen ? "default" : "outline"}
                    className={`h-12 px-6 font-semibold transition-colors ${
                      isChatOpen
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border-2 border-primary text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    <MessageCircle className="h-5 w-5 ml-2" />
                    {isChatOpen ? "סגור צ'אט" : "שוחח עם AI"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 text-white">
              <p className="text-base opacity-90">
                כל הדירות החדשות בישראל רק באתר מדלן!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
