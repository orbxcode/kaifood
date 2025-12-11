import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChefHat, Plus, Calendar, Users, MapPin, Clock, ArrowLeft } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  matching: "bg-blue-500/10 text-blue-600 border-blue-200",
  matched: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  booked: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
}

export default async function CustomerRequestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: requests } = await supabase
    .from("event_requests")
    .select(`
      *,
      matches:matches(
        id,
        caterer:caterers(
          business_name,
          profile:profiles(avatar_url)
        )
      )
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/customer/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Kai</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
            <p className="text-muted-foreground mt-1">Manage your catering requests</p>
          </div>
          <Button asChild>
            <Link href="/customer/requests/new">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        {!requests || requests.length === 0 ? (
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
            {requests.map((request) => (
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
                          {request.matches.slice(0, 3).map(
                            (
                              match: {
                                id: string
                                caterer: { business_name: string; profile: { avatar_url: string | null } }
                              },
                              i: number,
                            ) => (
                              <Avatar key={i} className="w-8 h-8 border-2 border-background">
                                <AvatarImage src={match.caterer?.profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {match.caterer?.business_name?.charAt(0) || "C"}
                                </AvatarFallback>
                              </Avatar>
                            ),
                          )}
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
      </main>
    </div>
  )
}
