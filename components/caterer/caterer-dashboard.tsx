"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import {
  ChefHat,
  Calendar,
  Users,
  MapPin,
  Star,
  ArrowRight,
  Settings,
  Bell,
  TrendingUp,
  CreditCard,
  Crown,
} from "lucide-react"
import type { Profile, Caterer, Match, EventRequest } from "@/lib/types"
import { formatDistanceToNow, format } from "date-fns"

interface CatererDashboardProps {
  profile: Profile
  caterer: Caterer | null
  matches: (Match & { event_request: EventRequest & { customer: Profile } })[]
}

const matchStatusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  viewed: "bg-blue-500/10 text-blue-600 border-blue-200",
  contacted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  quoted: "bg-primary/10 text-primary border-primary/20",
  accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  declined: "bg-muted text-muted-foreground border-border",
}

const tierColors: Record<string, string> = {
  basic: "from-emerald-500 to-teal-500",
  pro: "from-rose-500 to-orange-500",
  business: "from-amber-500 to-yellow-500",
}

export function CatererDashboard({ profile, caterer, matches }: CatererDashboardProps) {
  const pendingMatches = matches.filter((m) => m.status === "pending")
  const activeMatches = matches.filter((m) => ["viewed", "contacted", "quoted"].includes(m.status))
  const completedMatches = matches.filter((m) => m.status === "accepted")

  const profileComplete = caterer?.profile_completeness || 0
  const subscriptionTier = (caterer as any)?.subscription_tier || null
  const isSubscribed = subscriptionTier && subscriptionTier !== "none"

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <DashboardHeader 
        user={{
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          user_type: 'caterer',
          is_admin: profile.is_admin
        }}
        notifications={pendingMatches.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{caterer?.business_name || "Welcome"}</h1>
          <p className="text-muted-foreground mt-1">Manage your catering inquiries and bookings</p>
        </div>

        {!isSubscribed && (
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white overflow-hidden">
            <CardContent className="pt-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <Crown className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Upgrade to Start Receiving Jobs</h3>
                    <p className="text-white/80">
                      Subscribe to a plan to get matched with customers looking for caterers like you
                    </p>
                  </div>
                </div>
                <Button size="lg" className="bg-white text-rose-600 hover:bg-white/90 shadow-lg" asChild>
                  <Link href="/caterer/subscription">
                    <CreditCard className="w-4 h-4 mr-2" />
                    View Plans
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isSubscribed && (
          <Card
            className={`mb-8 border-0 shadow-xl bg-gradient-to-r ${tierColors[subscriptionTier] || tierColors.basic} text-white`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Current Plan</p>
                    <h3 className="text-xl font-bold capitalize">{subscriptionTier} Plan</h3>
                  </div>
                </div>
                <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30" asChild>
                  <Link href="/caterer/subscription">Manage Subscription</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Completeness Alert */}
        {profileComplete < 80 && (
          <Card className="mb-8 border-amber-200 bg-amber-50/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Complete your profile</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    A complete profile helps you get matched with more customers
                  </p>
                  <div className="flex items-center gap-3">
                    <Progress value={profileComplete} className="h-2 flex-1 max-w-xs" />
                    <span className="text-sm font-medium">{profileComplete}%</span>
                  </div>
                </div>
                <Button
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                  asChild
                >
                  <Link href="/caterer/profile">
                    Complete Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingMatches.length}</div>
                  <div className="text-sm text-muted-foreground">New Inquiries</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{activeMatches.length}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{completedMatches.length}</div>
                  <div className="text-sm text-muted-foreground">Bookings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
                  <Star className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{caterer?.rating?.toFixed(1) || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inquiries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recent Inquiries</h2>
            {matches.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/caterer/inquiries">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {matches.length === 0 ? (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No inquiries yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {isSubscribed
                    ? "Complete your profile to start receiving customer inquiries matched to your services."
                    : "Subscribe to a plan to start receiving customer inquiries."}
                </p>
                <Button
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
                  asChild
                >
                  <Link href={isSubscribed ? "/caterer/profile" : "/caterer/subscription"}>
                    {isSubscribed ? "Complete Profile" : "View Plans"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {matches.slice(0, 5).map((match) => (
                <Card
                  key={match.id}
                  className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all"
                >
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                          <AvatarImage src={match.event_request?.customer?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-rose-400 to-orange-400 text-white">
                            {match.event_request?.customer?.full_name?.charAt(0) || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">
                              {match.event_request?.event_name || match.event_request?.event_type}
                            </h3>
                            <Badge variant="outline" className={matchStatusColors[match.status]}>
                              {match.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{match.event_request?.customer?.full_name}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(match.event_request?.event_date), "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {match.event_request?.guest_count} guests
                            </div>
                            {match.event_request?.city && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {match.event_request?.city}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-16 md:ml-0">
                        <div className="text-right">
                          <div className="text-sm font-medium bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                            {Math.round((match.overall_score || 0) * 100)}% match
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent hover:bg-gradient-to-r hover:from-rose-500 hover:to-orange-500 hover:text-white hover:border-transparent"
                          asChild
                        >
                          <Link href={`/caterer/inquiries/${match.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
