"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Brain, TrendingUp, Sparkles, RefreshCw, Plus, Trash2 } from "lucide-react"

interface LocationEval {
  id: string
  input: string
  normalizedCity: string
  normalizedProvince: string
  confidence: "high" | "medium" | "low"
  source: "alias" | "learned" | "ai"
  timestamp: number
}

interface LearnedLocation {
  alias: string
  city: string
  province: string
  lat: number
  lng: number
  useCount: number
  lastUsed: number
  addedBy: "system" | "admin" | "user_correction"
}

interface SystemHealth {
  locationAccuracy: number
  matchingSuccessRate: number
  averageRating: number
  learnedLocationsCount: number
}

interface LocationStats {
  total: number
  confidence_high: number
  confidence_medium: number
  confidence_low: number
  source_alias: number
  source_learned: number
  source_ai: number
  corrections: number
}

export function EvalsAdminDashboard() {
  const [locationEvals, setLocationEvals] = useState<LocationEval[]>([])
  const [learnedLocations, setLearnedLocations] = useState<LearnedLocation[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingLocation, setAddingLocation] = useState(false)
  const [newLocation, setNewLocation] = useState({
    alias: "",
    city: "",
    province: "",
    lat: "",
    lng: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [evalsRes, learnedRes, healthRes, statsRes] = await Promise.all([
        fetch("/api/admin/evals/locations"),
        fetch("/api/admin/evals/learned-locations"),
        fetch("/api/admin/evals/health"),
        fetch("/api/admin/evals/stats"),
      ])

      if (evalsRes.ok) setLocationEvals(await evalsRes.json())
      if (learnedRes.ok) setLearnedLocations(await learnedRes.json())
      if (healthRes.ok) setSystemHealth(await healthRes.json())
      if (statsRes.ok) setLocationStats(await statsRes.json())
    } catch (error) {
      console.error("Failed to fetch evals data:", error)
    }
    setLoading(false)
  }

  async function handleAddLocation() {
    setAddingLocation(true)
    try {
      const res = await fetch("/api/admin/evals/learned-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLocation,
          lat: Number.parseFloat(newLocation.lat),
          lng: Number.parseFloat(newLocation.lng),
        }),
      })

      if (res.ok) {
        setNewLocation({ alias: "", city: "", province: "", lat: "", lng: "" })
        fetchData()
      }
    } catch (error) {
      console.error("Failed to add location:", error)
    }
    setAddingLocation(false)
  }

  async function handleDeleteLocation(alias: string) {
    try {
      await fetch(`/api/admin/evals/learned-locations?alias=${encodeURIComponent(alias)}`, {
        method: "DELETE",
      })
      fetchData()
    } catch (error) {
      console.error("Failed to delete location:", error)
    }
  }

  const confidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "low":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const sourceColor = (source: string) => {
    switch (source) {
      case "alias":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "learned":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
      case "ai":
        return "bg-pink-500/10 text-pink-600 border-pink-500/20"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
              Kai Evals Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">Monitor system learning, location accuracy, and matching performance</p>
        </div>

        {/* System Health Cards */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Location Accuracy</p>
                    <p className="text-2xl font-bold text-emerald-600">{systemHealth.locationAccuracy}%</p>
                  </div>
                  <div className="p-3 rounded-full bg-emerald-500/10">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Matching Success</p>
                    <p className="text-2xl font-bold text-blue-600">{systemHealth.matchingSuccessRate}%</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold text-amber-600">{systemHealth.averageRating}/5</p>
                  </div>
                  <div className="p-3 rounded-full bg-amber-500/10">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Learned Locations</p>
                    <p className="text-2xl font-bold text-purple-600">{systemHealth.learnedLocationsCount}</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500/10">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Breakdown */}
        {locationStats && (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-rose-500" />
                Location Resolution Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <p className="text-sm text-emerald-700">High Confidence</p>
                  <p className="text-xl font-bold text-emerald-800">{locationStats.confidence_high || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100">
                  <p className="text-sm text-amber-700">Medium Confidence</p>
                  <p className="text-xl font-bold text-amber-800">{locationStats.confidence_medium || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <p className="text-sm text-purple-700">From Learned</p>
                  <p className="text-xl font-bold text-purple-800">{locationStats.source_learned || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100">
                  <p className="text-sm text-pink-700">From AI</p>
                  <p className="text-xl font-bold text-pink-800">{locationStats.source_ai || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="locations" className="space-y-4">
          <TabsList className="bg-white/80 backdrop-blur">
            <TabsTrigger value="locations">Location Evals</TabsTrigger>
            <TabsTrigger value="learned">Learned Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="locations">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Location Normalizations</CardTitle>
                  <CardDescription>Track how the system interprets user location inputs</CardDescription>
                </div>
                <Button onClick={fetchData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Input</TableHead>
                      <TableHead>Normalized To</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationEvals.map((eval_) => (
                      <TableRow key={eval_.id}>
                        <TableCell className="font-medium">{eval_.input}</TableCell>
                        <TableCell>
                          {eval_.normalizedCity}, {eval_.normalizedProvince}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={confidenceColor(eval_.confidence)}>
                            {eval_.confidence}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sourceColor(eval_.source)}>
                            {eval_.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(eval_.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {locationEvals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No location evals recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="learned">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Learned Location Mappings</CardTitle>
                  <CardDescription>Aliases the system has learned from usage and corrections</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Location Alias</DialogTitle>
                      <DialogDescription>Teach Kai a new location alias for better matching</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Alias (what users type)</Label>
                        <Input
                          placeholder="e.g., jozi, cpt, durbs"
                          value={newLocation.alias}
                          onChange={(e) => setNewLocation({ ...newLocation, alias: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            placeholder="Johannesburg"
                            value={newLocation.city}
                            onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Province</Label>
                          <Input
                            placeholder="Gauteng"
                            value={newLocation.province}
                            onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Latitude</Label>
                          <Input
                            placeholder="-26.2041"
                            value={newLocation.lat}
                            onChange={(e) => setNewLocation({ ...newLocation, lat: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Longitude</Label>
                          <Input
                            placeholder="28.0473"
                            value={newLocation.lng}
                            onChange={(e) => setNewLocation({ ...newLocation, lng: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleAddLocation}
                        disabled={addingLocation}
                        className="w-full bg-gradient-to-r from-rose-500 to-orange-500"
                      >
                        {addingLocation ? "Adding..." : "Add Location"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alias</TableHead>
                      <TableHead>Maps To</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Use Count</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learnedLocations.map((loc) => (
                      <TableRow key={loc.alias}>
                        <TableCell className="font-medium font-mono">{loc.alias}</TableCell>
                        <TableCell>
                          {loc.city}, {loc.province}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{loc.useCount}x</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              loc.addedBy === "system"
                                ? "bg-blue-500/10 text-blue-600"
                                : loc.addedBy === "admin"
                                  ? "bg-purple-500/10 text-purple-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                            }
                          >
                            {loc.addedBy}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(loc.alias)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {learnedLocations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No learned locations yet - the system will learn from usage
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
