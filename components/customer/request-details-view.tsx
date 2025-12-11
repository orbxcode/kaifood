"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ChefHat,
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Star,
  MessageSquare,
  Sparkles,
  DollarSign,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import type { EventRequest, Match, Caterer, Profile } from "@/lib/types"
import { format } from "date-fns"

interface RequestDetailsViewProps {
  request: EventRequest & {
    matches: (Match & { caterer: Caterer & { profile: Profile } })[]
  }
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  matching: "bg-blue-500/10 text-blue-600 border-blue-200",
  matched: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  booked: "bg-rose-500/10 text-rose-600 border-rose-200",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
}

export function RequestDetailsView({ request }: RequestDetailsViewProps) {
  const router = useRouter()
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const handleAcceptQuote = async (matchId: string) => {
    setAcceptingId(matchId)
    try {
      const res = await fetch("/api/match/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to accept:", error)
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/customer/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
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
        {/* Request Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{request.event_name || request.event_type}</h1>
                <Badge variant="outline" className={statusColors[request.status]}>
                  {request.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(request.event_date), "EEEE, MMMM d, yyyy")}
                  {request.event_time && ` at ${request.event_time}`}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {request.guest_count} guests
                </div>
                {request.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {request.venue_name ? `${request.venue_name}, ` : ""}
                    {request.city}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Request Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.cuisine_preferences && request.cuisine_preferences.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Cuisine Preferences</p>
                    <div className="flex flex-wrap gap-1.5">
                      {request.cuisine_preferences.map((cuisine) => (
                        <Badge key={cuisine} variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {request.dietary_requirements && request.dietary_requirements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Dietary Requirements</p>
                    <div className="flex flex-wrap gap-1.5">
                      {request.dietary_requirements.map((diet) => (
                        <Badge key={diet} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {diet}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {request.service_style && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Service Style</p>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                      {request.service_style}
                    </Badge>
                  </div>
                )}

                {(request.budget_min || request.budget_max) && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Budget (per person)</p>
                    <p className="text-muted-foreground">
                      R{request.budget_min || 0} - R{request.budget_max || "No limit"}
                    </p>
                  </div>
                )}

                {request.additional_notes && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Additional Notes</p>
                    <p className="text-sm text-muted-foreground">{request.additional_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Matched Caterers */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                Matched Caterers
                {request.matches && request.matches.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-2">({request.matches.length} found)</span>
                )}
              </h2>
            </div>

            {request.status === "matching" ? (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Finding your perfect caterers...</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Our AI is analyzing your requirements and matching you with the best caterers in your area.
                  </p>
                </CardContent>
              </Card>
            ) : request.matches && request.matches.length > 0 ? (
              <div className="space-y-4">
                {request.matches.map((match, index) => (
                  <Card
                    key={match.id}
                    className={`border-0 shadow-lg transition-all ${
                      match.status === "accepted"
                        ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300"
                        : "bg-white/80 backdrop-blur-sm hover:shadow-xl"
                    }`}
                  >
                    <CardContent className="py-5">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="relative">
                            <Avatar className="w-16 h-16 ring-2 ring-white shadow-md">
                              <AvatarImage src={match.caterer?.profile?.avatar_url || undefined} />
                              <AvatarFallback className="text-lg bg-gradient-to-br from-rose-400 to-orange-400 text-white">
                                {match.caterer?.business_name?.charAt(0) || "C"}
                              </AvatarFallback>
                            </Avatar>
                            {index < 3 && match.status !== "accepted" && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                                #{index + 1}
                              </div>
                            )}
                            {match.status === "accepted" && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{match.caterer?.business_name}</h3>
                              {match.caterer?.is_verified && (
                                <CheckCircle2 className="w-4 h-4 text-rose-500 flex-shrink-0" />
                              )}
                              {match.status === "accepted" && <Badge className="bg-emerald-500">Booked</Badge>}
                            </div>
                            {match.caterer?.rating && match.caterer.rating > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="text-sm font-medium">{match.caterer.rating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">
                                  ({match.caterer.total_reviews} reviews)
                                </span>
                              </div>
                            )}
                            {match.caterer?.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {match.caterer.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {match.caterer?.cuisine_types?.slice(0, 3).map((cuisine) => (
                                <Badge key={cuisine} variant="secondary" className="text-xs bg-rose-100 text-rose-700">
                                  {cuisine}
                                </Badge>
                              ))}
                              {match.caterer?.cuisine_types && match.caterer.cuisine_types.length > 3 && (
                                <Badge variant="secondary" className="text-xs bg-rose-100 text-rose-700">
                                  +{match.caterer.cuisine_types.length - 3}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {match.caterer?.min_guests}-{match.caterer?.max_guests} guests
                              </div>
                              {match.caterer?.price_range_min && match.caterer?.price_range_max && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />R{match.caterer.price_range_min}-
                                  {match.caterer.price_range_max}/pp
                                </div>
                              )}
                              {match.distance_km && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {match.distance_km.toFixed(1)} km
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between gap-4 sm:w-48">
                          <div className="text-right">
                            {match.status === "quoted" && match.quoted_price ? (
                              <>
                                <div className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                                  R{match.quoted_price}
                                </div>
                                <div className="text-xs text-muted-foreground">per person quoted</div>
                              </>
                            ) : (
                              <>
                                <div className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                                  {Math.round((match.overall_score || 0) * 100)}%
                                </div>
                                <div className="text-xs text-muted-foreground">Match Score</div>
                              </>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            {match.status === "quoted" && request.status !== "booked" && (
                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                onClick={() => handleAcceptQuote(match.id)}
                                disabled={acceptingId === match.id}
                              >
                                {acceptingId === match.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Accept Quote
                                  </>
                                )}
                              </Button>
                            )}
                            {match.status !== "accepted" && match.status !== "declined" && (
                              <Button
                                size="sm"
                                variant={match.status === "quoted" ? "outline" : "default"}
                                className={
                                  match.status === "quoted"
                                    ? "w-full bg-transparent"
                                    : "w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                                }
                                asChild
                              >
                                <Link href={`/chat/${match.id}`}>
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Contact
                                </Link>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                              <Link href={`/caterers/${match.caterer_id}`}>View Profile</Link>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      {match.match_reasons && Object.keys(match.match_reasons).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Why this match:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.values(match.match_reasons).map((reason, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200"
                              >
                                {String(reason)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quote Response */}
                      {match.caterer_response && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Caterer message:</p>
                          <p className="text-sm">{match.caterer_response}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No matches found yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    We are still searching for caterers that match your requirements. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
