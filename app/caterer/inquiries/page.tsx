import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChefHat, Calendar, Users, MapPin, ArrowLeft, Bell, MessageSquare } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  viewed: "bg-blue-500/10 text-blue-600 border-blue-200",
  contacted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  quoted: "bg-primary/10 text-primary border-primary/20",
  accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  declined: "bg-muted text-muted-foreground border-border",
}

export default async function CatererInquiriesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get caterer profile
  const { data: caterer } = await supabase.from("caterers").select("id").eq("profile_id", user.id).single()

  if (!caterer) {
    redirect("/customer/dashboard")
  }

  // Get all matches
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      event_request:event_requests(
        *,
        customer:profiles!event_requests_customer_id_fkey(full_name, avatar_url)
      )
    `)
    .eq("caterer_id", caterer.id)
    .order("created_at", { ascending: false })

  const pendingMatches = matches?.filter((m) => ["pending", "viewed"].includes(m.status)) || []
  const activeMatches = matches?.filter((m) => ["contacted", "quoted"].includes(m.status)) || []
  const completedMatches = matches?.filter((m) => ["accepted", "declined"].includes(m.status)) || []

  const renderMatchCard = (match: typeof matches extends (infer T)[] | null ? T : never) => (
    <Card key={match.id} className="hover:border-primary/30 transition-colors">
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={match.event_request?.customer?.avatar_url || undefined} />
              <AvatarFallback>{match.event_request?.customer?.full_name?.charAt(0) || "C"}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground">
                  {match.event_request?.event_name || match.event_request?.event_type}
                </h3>
                <Badge variant="outline" className={statusColors[match.status]}>
                  {match.status}
                </Badge>
                {match.status === "pending" && (
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
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
              <div className="text-sm font-medium text-primary">{Math.round(match.overall_score * 100)}% match</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/caterer/inquiries/${match.id}`}>
                <MessageSquare className="w-4 h-4 mr-2" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/caterer/dashboard"
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Inquiries</h1>
          <p className="text-muted-foreground mt-1">Manage your customer inquiries and bookings</p>
        </div>

        <Tabs defaultValue="new" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new" className="relative">
              New
              {pendingMatches.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full">
                  {pendingMatches.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              {activeMatches.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                  {activeMatches.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            {pendingMatches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No new inquiries</h3>
                  <p className="text-muted-foreground">New customer inquiries will appear here</p>
                </CardContent>
              </Card>
            ) : (
              pendingMatches.map(renderMatchCard)
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeMatches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No active conversations</h3>
                  <p className="text-muted-foreground">Inquiries you are actively working on will appear here</p>
                </CardContent>
              </Card>
            ) : (
              activeMatches.map(renderMatchCard)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedMatches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No completed inquiries</h3>
                  <p className="text-muted-foreground">Accepted and declined inquiries will appear here</p>
                </CardContent>
              </Card>
            ) : (
              completedMatches.map(renderMatchCard)
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
