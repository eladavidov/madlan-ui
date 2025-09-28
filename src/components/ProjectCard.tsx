"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, DollarSign } from "lucide-react";

interface ProjectCardProps {
  id: string;
  name: string;
  developer: string;
  location: string;
  priceFrom: number;
  units: number;
  completion: string;
  image: string;
  status: "pre-construction" | "under-construction" | "ready";
}

export default function ProjectCard({
  id,
  name,
  developer,
  location,
  priceFrom,
  units,
  completion,
  image,
  status,
}: ProjectCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = () => {
    switch (status) {
      case "pre-construction":
        return <Badge className="bg-blue-500 text-white">לפני בנייה</Badge>;
      case "under-construction":
        return <Badge className="bg-orange-500 text-white">בבנייה</Badge>;
      case "ready":
        return <Badge className="bg-green-500 text-white">מוכן למגורים</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>

        {/* Overlay with quick info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 right-4 left-4 text-white">
            <p className="text-sm mb-1">{developer}</p>
            <p className="text-xs opacity-90">{units} יחידות דיור</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Project Name */}
        <h3 className="text-xl font-bold mb-1">{name}</h3>

        {/* Developer */}
        <p className="text-sm text-muted-foreground mb-3">{developer}</p>

        {/* Location */}
        <div className="flex items-center text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 ml-1" />
          <span className="text-sm">{location}</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-start gap-2">
            <DollarSign className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">החל מ-</p>
              <p className="text-sm font-semibold">{formatPrice(priceFrom)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">אכלוס</p>
              <p className="text-sm font-semibold">{completion}</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button className="w-full gradient-primary text-white">
          לכל הדירות החדשות
        </Button>
      </div>
    </Card>
  );
}
