"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  const [searchType, setSearchType] = useState("buy");
  const [location, setLocation] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (location.trim()) {
      router.push(`/haifa?location=${encodeURIComponent(location)}&type=${searchType}`);
    } else {
      router.push(`/haifa?type=${searchType}`);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="gradient-hero min-h-[500px] relative">
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
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              מדלן. הלוח של הקונים.
            </h1>

            {/* Search Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              {/* Tabs */}
              <div className="flex justify-center mb-6">
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
                <Button 
                  onClick={handleSearch}
                  className="h-12 px-8 gradient-primary text-white font-semibold"
                >
                  <Search className="h-5 w-5 ml-2" />
                  חיפוש
                </Button>
              </div>

              {/* Banner */}
              <div className="mt-6 flex items-center justify-center">
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm">
                  <span className="text-orange-700">🏠</span>
                  <span className="text-gray-700 mr-2">
                    הזנו לדירה עכשיו בבנק הפועלים
                  </span>
                  <a href="#" className="text-primary hover:underline">
                    לקבלת הצעה &larr;
                  </a>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 text-white">
              <p className="text-lg">
                כל הדירות החדשות בישראל רק באתר מדלן!
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button className="text-white/90 hover:text-white transition-colors">
                  &rarr; לצפייה בכל הנכסים
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
