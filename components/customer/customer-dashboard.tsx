"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChefHat, Plus, Calendar, Users, MapPin, Star, ArrowRight, Clock, Sparkles } from "lucide-react"
import type { Profile, EventRequest, Match } from "@/lib/types"
import { formatDistanceToNow, format } from "date-fns"

interface CustomerDashboardProps {
  profile: Profile
  requests: (EventRequest & { matches: (Match & { caterer: { profile: Profile } & Record<string, unknown> })[] })[]
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  matching: "bg-blue-500/10 text-blue-600 border-blue-200",
  matched: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  booked: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
}

export function CustomerDashboard({ profile, requests }: CustomerDashboardProps) {
  const activeRequests = requests.filter((r) => !["completed", "cancelled"].includes(r.status))
  const totalMatches = requests.reduce((acc, r) => acc + (r.matches?.length || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Kai</span>
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/customer/requests">My Requests</Link>
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{profile.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {profile.full_name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground mt-1">Find the perfect caterer for your next event</p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{activeRequests.length}</div>
                  <div className="text-sm text-muted-foreground">Active Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalMatches}</div>
                  <div className="text-sm text-muted-foreground">Total Matches</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{requests.filter((r) => r.status === "completed").length}</div>
                  <div className="text-sm text-muted-foreground">Events Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Ready to plan your next event?</h3>
                <p className="text-muted-foreground">
                  Create a request and let our AI find the perfect caterers for you
                </p>
              </div>
              <Button size="lg" asChild>
                <Link href="/customer/requests/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Request
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recent Requests</h2>
            {requests.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/customer/requests">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your first event request and let Kai find the perfect caterers for you.
                </p>
                <Button asChild>
                  <Link href="/customer/requests/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Request
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.slice(0, 5).map((request) => (
                <Card key={request.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{request.event_name || request.event_type}</h3>
                          <Badge variant="outline" className={statusColors[request.status]}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(request.event_date), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {request.guest_count} guests
                          </div>
                          {request.city && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {request.city}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {request.matches && request.matches.length > 0 && (
                          <div className="flex -space-x-2">
                            {request.matches.slice(0, 3).map((match, i) => (
                              <Avatar key={i} className="w-8 h-8 border-2 border-background">
                                <AvatarImage src={match.caterer?.profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {match.caterer?.business_name?.charAt(0) || "C"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {request.matches.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                +{request.matches.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/customer/requests/${request.id}`}>View Details</Link>
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
