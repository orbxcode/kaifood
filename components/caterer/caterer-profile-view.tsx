"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ChefHat,
  ArrowLeft,
  Star,
  MapPin,
  Users,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  Utensils,
  Clock,
} from "lucide-react"
import type { Caterer, Profile, Review, MenuItem, Match } from "@/lib/types"
import { format } from "date-fns"

interface CatererProfileViewProps {
  caterer: Caterer & { profile: Profile }
  reviews: (Review & { reviewer: Profile })[]
  menuItems: MenuItem[]
  activeMatch: Match | null
  isLoggedIn: boolean
}

export function CatererProfileView({ caterer, reviews, menuItems, activeMatch, isLoggedIn }: CatererProfileViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">Kai</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-8">
          <div className="h-48 rounded-2xl bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="absolute -bottom-12 left-8 flex items-end gap-6">
            <Avatar className="w-32 h-32 ring-4 ring-white shadow-xl">
              <AvatarImage src={caterer.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-rose-500 to-orange-500 text-white">
                {caterer.business_name?.charAt(0) || "C"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="mt-16 grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{caterer.business_name}</h1>
                      {caterer.is_verified && <CheckCircle2 className="w-6 h-6 text-rose-500" />}
                    </div>
                    {caterer.rating && caterer.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.floor(caterer.rating!) ? "fill-amber-400 text-amber-400" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{caterer.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({caterer.total_reviews} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>

                {caterer.description && <p className="text-muted-foreground mb-6">{caterer.description}</p>}

                <div className="grid sm:grid-cols-2 gap-4">
                  {caterer.city && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{caterer.city}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="font-medium">
                        {caterer.min_guests || 10} - {caterer.max_guests || 500} guests
                      </p>
                    </div>
                  </div>
                  {(caterer.price_range_min || caterer.price_range_max) && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price Range</p>
                        <p className="font-medium">
                          R{caterer.price_range_min} - R{caterer.price_range_max} per person
                        </p>
                      </div>
                    </div>
                  )}
                  {caterer.service_radius_km && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Service Radius</p>
                        <p className="font-medium">{caterer.service_radius_km} km</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cuisines & Services */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Specialties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {caterer.cuisine_types && caterer.cuisine_types.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Cuisines</p>
                    <div className="flex flex-wrap gap-2">
                      {caterer.cuisine_types.map((cuisine) => (
                        <Badge key={cuisine} className="bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {caterer.service_styles && caterer.service_styles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Service Styles</p>
                    <div className="flex flex-wrap gap-2">
                      {caterer.service_styles.map((style) => (
                        <Badge key={style} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {caterer.dietary_capabilities && caterer.dietary_capabilities.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Dietary Options</p>
                    <div className="flex flex-wrap gap-2">
                      {caterer.dietary_capabilities.map((diet) => (
                        <Badge
                          key={diet}
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          {diet}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {caterer.event_types && caterer.event_types.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Event Types</p>
                    <div className="flex flex-wrap gap-2">
                      {caterer.event_types.map((event) => (
                        <Badge key={event} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Menu Items */}
            {menuItems.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    Sample Menu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {menuItems.map((item) => (
                      <div key={item.id} className="p-4 rounded-lg bg-gradient-to-br from-rose-50 to-orange-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.price_per_person && (
                            <span className="text-sm font-semibold text-rose-600">R{item.price_per_person}</span>
                          )}
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                        {item.dietary_tags && item.dietary_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.dietary_tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                          <AvatarFallback>{review.reviewer?.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{review.reviewer?.full_name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(review.created_at), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      {review.title && <p className="font-medium mb-1">{review.title}</p>}
                      {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Contact */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Contact {caterer.business_name}</h3>

                  {activeMatch ? (
                    <>
                      <p className="text-sm text-muted-foreground">You have an active inquiry with this caterer.</p>
                      <Button
                        className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                        asChild
                      >
                        <Link href={`/chat/${activeMatch.id}`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Continue Chat
                        </Link>
                      </Button>
                    </>
                  ) : isLoggedIn ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Create an event request to get matched with this caterer.
                      </p>
                      <Button
                        className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                        asChild
                      >
                        <Link href="/customer/requests/new">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Create Request
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Sign in to contact this caterer.</p>
                      <Button
                        className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                        asChild
                      >
                        <Link href="/auth/login">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Sign In to Contact
                        </Link>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-orange-500 text-white">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold">{caterer.total_reviews || 0}</p>
                      <p className="text-sm text-white/80">Reviews</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{caterer.rating?.toFixed(1) || "N/A"}</p>
                      <p className="text-sm text-white/80">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
