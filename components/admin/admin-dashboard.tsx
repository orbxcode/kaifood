"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChefHat,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Search,
  Eye,
  Trash2,
  BarChart3,
  ShieldCheck,
} from "lucide-react"
import type { Profile, Caterer, EventRequest, Match } from "@/lib/types"
import { format } from "date-fns"

interface AdminDashboardProps {
  profiles: Profile[]
  caterers: (Caterer & { profile: Profile })[]
  requests: (EventRequest & { customer: Profile })[]
  matches: (Match & { caterer: Caterer & { profile: Profile }; event_request: EventRequest })[]
  counts: {
    profiles: number
    caterers: number
    requests: number
    matches: number
    messages: number
  }
}

export function AdminDashboard({ profiles, caterers, requests, matches, counts }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const customers = profiles.filter((p) => p.user_type === "customer")
  const catererProfiles = profiles.filter((p) => p.user_type === "caterer")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-white">Kai</span>
              </Link>
              <Badge variant="outline" className="border-rose-500/50 text-rose-400 bg-rose-500/10">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/evals">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Evals Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{counts.profiles}</div>
                  <div className="text-sm text-slate-400">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{counts.caterers}</div>
                  <div className="text-sm text-slate-400">Caterers</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{counts.requests}</div>
                  <div className="text-sm text-slate-400">Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{counts.matches}</div>
                  <div className="text-sm text-slate-400">Matches</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{counts.messages}</div>
                  <div className="text-sm text-slate-400">Messages</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users, caterers, requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
              Overview
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-white/10">
              Customers ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="caterers" className="data-[state=active]:bg-white/10">
              Caterers ({caterers.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-white/10">
              Requests ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-white/10">
              Matches ({matches.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Customers */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Recent Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customers.slice(0, 5).map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={customer.avatar_url || undefined} />
                            <AvatarFallback className="bg-blue-500/20 text-blue-400">
                              {customer.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{customer.full_name || "Unknown"}</p>
                            <p className="text-sm text-slate-400">{customer.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                          Customer
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Caterers */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Recent Caterers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {caterers.slice(0, 5).map((caterer) => (
                      <div key={caterer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={caterer.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-rose-500/20 text-rose-400">
                              {caterer.business_name?.charAt(0) || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{caterer.business_name}</p>
                            <p className="text-sm text-slate-400">{caterer.city || "No location"}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            caterer.is_active
                              ? "border-emerald-500/50 text-emerald-400"
                              : "border-slate-500/50 text-slate-400"
                          }
                        >
                          {caterer.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Requests */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Recent Event Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-slate-400">Event</TableHead>
                      <TableHead className="text-slate-400">Customer</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-400">Guests</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.slice(0, 10).map((request) => (
                      <TableRow key={request.id} className="border-white/10">
                        <TableCell className="text-white font-medium">
                          {request.event_name || request.event_type}
                        </TableCell>
                        <TableCell className="text-slate-300">{request.customer?.full_name}</TableCell>
                        <TableCell className="text-slate-300">
                          {format(new Date(request.event_date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-slate-300">{request.guest_count}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              request.status === "matched"
                                ? "border-emerald-500/50 text-emerald-400"
                                : request.status === "pending"
                                  ? "border-amber-500/50 text-amber-400"
                                  : "border-slate-500/50 text-slate-400"
                            }
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-slate-400">User</TableHead>
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Phone</TableHead>
                      <TableHead className="text-slate-400">Joined</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers
                      .filter(
                        (c) =>
                          !searchTerm ||
                          c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      .map((customer) => (
                        <TableRow key={customer.id} className="border-white/10">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={customer.avatar_url || undefined} />
                                <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                                  {customer.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white">{customer.full_name || "Unknown"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{customer.email}</TableCell>
                          <TableCell className="text-slate-300">{customer.phone || "-"}</TableCell>
                          <TableCell className="text-slate-300">
                            {format(new Date(customer.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Caterers Tab */}
          <TabsContent value="caterers">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-slate-400">Business</TableHead>
                      <TableHead className="text-slate-400">Location</TableHead>
                      <TableHead className="text-slate-400">Rating</TableHead>
                      <TableHead className="text-slate-400">Tier</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {caterers
                      .filter(
                        (c) =>
                          !searchTerm ||
                          c.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.city?.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      .map((caterer) => (
                        <TableRow key={caterer.id} className="border-white/10">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={caterer.profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-rose-500/20 text-rose-400 text-xs">
                                  {caterer.business_name?.charAt(0) || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-white">{caterer.business_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{caterer.city || "-"}</TableCell>
                          <TableCell className="text-slate-300">
                            {caterer.rating ? `${caterer.rating.toFixed(1)} ⭐` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                (caterer as any).subscription_tier === "business"
                                  ? "border-amber-500/50 text-amber-400"
                                  : (caterer as any).subscription_tier === "pro"
                                    ? "border-rose-500/50 text-rose-400"
                                    : "border-emerald-500/50 text-emerald-400"
                              }
                            >
                              {(caterer as any).subscription_tier || "None"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                caterer.is_active
                                  ? "border-emerald-500/50 text-emerald-400"
                                  : "border-slate-500/50 text-slate-400"
                              }
                            >
                              {caterer.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" asChild>
                                <Link href={`/caterers/${caterer.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-slate-400">Event</TableHead>
                      <TableHead className="text-slate-400">Customer</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-400">Location</TableHead>
                      <TableHead className="text-slate-400">Guests</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests
                      .filter(
                        (r) =>
                          !searchTerm ||
                          r.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      .map((request) => (
                        <TableRow key={request.id} className="border-white/10">
                          <TableCell className="text-white font-medium">
                            {request.event_name || request.event_type}
                          </TableCell>
                          <TableCell className="text-slate-300">{request.customer?.full_name}</TableCell>
                          <TableCell className="text-slate-300">
                            {format(new Date(request.event_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-slate-300">{request.city || "-"}</TableCell>
                          <TableCell className="text-slate-300">{request.guest_count}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                request.status === "matched"
                                  ? "border-emerald-500/50 text-emerald-400"
                                  : request.status === "pending"
                                    ? "border-amber-500/50 text-amber-400"
                                    : request.status === "booked"
                                      ? "border-rose-500/50 text-rose-400"
                                      : "border-slate-500/50 text-slate-400"
                              }
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-slate-400">Event</TableHead>
                      <TableHead className="text-slate-400">Caterer</TableHead>
                      <TableHead className="text-slate-400">Score</TableHead>
                      <TableHead className="text-slate-400">Quote</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id} className="border-white/10">
                        <TableCell className="text-white">
                          {match.event_request?.event_name || match.event_request?.event_type}
                        </TableCell>
                        <TableCell className="text-slate-300">{match.caterer?.business_name}</TableCell>
                        <TableCell className="text-slate-300">
                          {Math.round((match.overall_score || 0) * 100)}%
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {match.quoted_price ? `R${match.quoted_price}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              match.status === "accepted"
                                ? "border-emerald-500/50 text-emerald-400"
                                : match.status === "quoted"
                                  ? "border-rose-500/50 text-rose-400"
                                  : "border-slate-500/50 text-slate-400"
                            }
                          >
                            {match.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" asChild>
                            <Link href={`/chat/${match.id}`}>
                              <MessageSquare className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
