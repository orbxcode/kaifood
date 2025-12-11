'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Star, MapPin, Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatererProfilePictureProps {
  caterer: {
    id: string;
    business_name: string;
    profile_picture_url?: string;
    cover_image_url?: string;
    logo_url?: string;
    city?: string;
    rating?: number;
    total_reviews?: number;
    price_range_min?: number;
    price_range_max?: number;
    cuisine_types?: string[];
    is_verified?: boolean;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
  showCover?: boolean;
  className?: string;
  onEditClick?: () => void;
  editable?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

export function CatererProfilePicture({
  caterer,
  size = 'md',
  showDetails = false,
  showCover = false,
  className,
  onEditClick,
  editable = false
}: CatererProfilePictureProps) {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPriceRange = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `R${min.toLocaleString()} - R${max.toLocaleString()}`;
    if (min) return `From R${min.toLocaleString()}`;
    if (max) return `Up to R${max.toLocaleString()}`;
  };

  if (showCover && showDetails) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        {/* Cover Image */}
        {showCover && (
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
            {caterer.cover_image_url && (
              <img
                src={caterer.cover_image_url}
                alt={`${caterer.business_name} cover`}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
            {editable && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={onEditClick}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className={cn(sizeClasses.xl, "border-4 border-white shadow-lg")}>
                <AvatarImage
                  src={imageError ? undefined : caterer.profile_picture_url}
                  alt={caterer.business_name}
                  onError={() => setImageError(true)}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {getInitials(caterer.business_name)}
                </AvatarFallback>
              </Avatar>
              
              {caterer.is_verified && (
                <div className="absolute -bottom-1 -right-1">
                  <Badge className="bg-green-500 text-white px-1 py-0.5 text-xs">
                    ✓
                  </Badge>
                </div>
              )}
            </div>

            {/* Business Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{caterer.business_name}</h3>
                {caterer.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>

              {/* Location */}
              {caterer.city && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" />
                  {caterer.city}
                </div>
              )}

              {/* Rating */}
              {caterer.rating && caterer.rating > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium ml-1">{caterer.rating.toFixed(1)}</span>
                  </div>
                  {caterer.total_reviews && caterer.total_reviews > 0 && (
                    <span className="text-sm text-muted-foreground">
                      ({caterer.total_reviews} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Price Range */}
              {formatPriceRange(caterer.price_range_min, caterer.price_range_max) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <DollarSign className="h-3 w-3" />
                  {formatPriceRange(caterer.price_range_min, caterer.price_range_max)}
                </div>
              )}

              {/* Cuisine Types */}
              {caterer.cuisine_types && caterer.cuisine_types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {caterer.cuisine_types.slice(0, 3).map((cuisine) => (
                    <Badge key={cuisine} variant="outline" className="text-xs">
                      {cuisine}
                    </Badge>
                  ))}
                  {caterer.cuisine_types.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{caterer.cuisine_types.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simple avatar display
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage
            src={imageError ? undefined : caterer.profile_picture_url}
            alt={caterer.business_name}
            onError={() => setImageError(true)}
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
            {getInitials(caterer.business_name)}
          </AvatarFallback>
        </Avatar>
        
        {caterer.is_verified && size !== 'sm' && (
          <div className="absolute -bottom-1 -right-1">
            <Badge className="bg-green-500 text-white px-1 py-0.5 text-xs">
              ✓
            </Badge>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{caterer.business_name}</h4>
            {caterer.is_verified && (
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            )}
          </div>
          
          {caterer.city && (
            <p className="text-sm text-muted-foreground truncate">{caterer.city}</p>
          )}
          
          {caterer.rating && caterer.rating > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{caterer.rating.toFixed(1)}</span>
              {caterer.total_reviews && caterer.total_reviews > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({caterer.total_reviews})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {editable && (
        <Button size="sm" variant="ghost" onClick={onEditClick}>
          <Camera className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}