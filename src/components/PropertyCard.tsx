"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Bed, Bath, Square, MapPin } from "lucide-react";
import { useState } from "react";

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
  type: "sale" | "rent";
  featured?: boolean;
}

export default function PropertyCard({
  id,
  title,
  price,
  location,
  beds,
  baths,
  area,
  image,
  type,
  featured = false,
}: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {/* Property Image */}
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          {featured && (
            <Badge className="bg-yellow-500 text-white">מומלץ</Badge>
          )}
          <Badge variant={type === "sale" ? "default" : "secondary"}>
            {type === "sale" ? "למכירה" : "להשכרה"}
          </Badge>
        </div>

        {/* Favorite Button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 left-3 bg-white/80 hover:bg-white"
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </Button>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {formatPrice(price)}
            {type === "rent" && <span className="text-sm font-normal">/חודש</span>}
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{title}</h3>

        {/* Location */}
        <div className="flex items-center text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 ml-1" />
          <span className="text-sm line-clamp-1">{location}</span>
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>{beds}</span>
            <span>חד׳</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <span>{area}</span>
            <span>מ״ר</span>
          </div>
          {baths > 0 && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span>{baths}</span>
                <span>קומה</span>
              </div>
            </>
          )}
        </div>

        {/* View Details Button */}
        <Button className="w-full mt-4" variant="outline">
          לכל המודעות במתחם
        </Button>
      </div>
    </Card>
  );
}
