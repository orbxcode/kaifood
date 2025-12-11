"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ChefHat,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Users,
  MapPin,
  Utensils,
  Sparkles,
  Wallet,
} from "lucide-react"
import { CUISINE_TYPES, DIETARY_OPTIONS, SERVICE_STYLES, EVENT_TYPES } from "@/lib/types"
import { SA_CITIES } from "@/lib/constants"

interface EventRequestFormProps {
  userId: string
}

export function EventRequestForm({ userId }: EventRequestFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "",
    eventDate: "",
    eventTime: "",
    guestCount: "",
    venueName: "",
    venueAddress: "",
    city: "",
    cuisinePreferences: [] as string[],
    dietaryRequirements: [] as string[],
    serviceStyle: "",
    budgetType: "per_person" as "per_person" | "total",
    budgetPerPerson: "",
    totalBudget: "",
    additionalNotes: "",
  })

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: "cuisinePreferences" | "dietaryRequirements", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value],
    }))
  }

  const calculateEstimatedBudget = () => {
    const guests = Number.parseInt(formData.guestCount) || 0
    if (formData.budgetType === "total" && formData.totalBudget) {
      return Number.parseFloat(formData.totalBudget)
    }
    if (formData.budgetPerPerson) {
      return guests * Number.parseFloat(formData.budgetPerPerson)
    }
    return 0
  }

  const getBudgetTier = () => {
    const total = calculateEstimatedBudget()
    if (total >= 50000) return { tier: "Premium", color: "text-amber-600", desc: "Matched with Business-tier caterers" }
    if (total >= 20000) return { tier: "Standard", color: "text-blue-600", desc: "Matched with Pro-tier caterers" }
    if (total > 0) return { tier: "Essential", color: "text-emerald-600", desc: "Matched with quality caterers" }
    return null
  }

  const getNormalizedCity = (cityInput: string): string => {
    // First check if it's a direct city from our list
    const cityData = SA_CITIES.find(
      (c) => c.city.toLowerCase() === cityInput.toLowerCase() || c.aliases?.some((a) => a === cityInput.toLowerCase()),
    )
    return cityData?.city || cityInput
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const totalBudget = calculateEstimatedBudget()
      const budgetPerPerson = formData.budgetPerPerson ? Number.parseFloat(formData.budgetPerPerson) : null
      const normalizedCity = getNormalizedCity(formData.city)

      console.log("[v0] Creating event request:", {
        userId,
        city: formData.city,
        normalizedCity,
        totalBudget,
      })

      const { data: request, error: insertError } = await supabase
        .from("event_requests")
        .insert({
          customer_id: userId,
          event_name: formData.eventName || null,
          event_type: formData.eventType,
          event_date: formData.eventDate,
          event_time: formData.eventTime || null,
          guest_count: Number.parseInt(formData.guestCount),
          venue_name: formData.venueName || null,
          venue_address: formData.venueAddress || null,
          city: formData.city || null,
          normalized_city: normalizedCity,
          cuisine_preferences: formData.cuisinePreferences,
          dietary_requirements: formData.dietaryRequirements,
          service_style: formData.serviceStyle || null,
          budget_type: formData.budgetType,
          budget_per_person: budgetPerPerson,
          total_budget: totalBudget > 0 ? totalBudget : null,
          budget_min: budgetPerPerson ? budgetPerPerson * 0.8 : totalBudget ? totalBudget * 0.8 : null,
          budget_max: budgetPerPerson || (totalBudget > 0 ? totalBudget / Number.parseInt(formData.guestCount) : null),
          additional_notes: formData.additionalNotes || null,
          status: "pending",
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Insert error:", insertError)
        throw new Error(insertError.message)
      }

      console.log("[v0] Request created successfully:", request.id)

      fetch("/api/matching/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      })
        .then((res) => res.json())
        .then((data) => console.log("[v0] Matching triggered:", data))
        .catch((err) => console.error("[v0] Matching trigger failed (non-blocking):", err))

      // Navigate immediately
      router.push(`/customer/requests/${request.id}`)
    } catch (err) {
      console.error("[v0] Form submission error:", err)
      setError(err instanceof Error ? err.message : "Failed to create request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.eventType && formData.eventDate && formData.guestCount
      case 2:
        return formData.city
      case 3:
        return true
      case 4:
        return (
          (formData.budgetType === "per_person" && formData.budgetPerPerson) ||
          (formData.budgetType === "total" && formData.totalBudget)
        )
      default:
        return false
    }
  }

  const budgetTier = getBudgetTier()

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/customer/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                Kai
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s === step
                      ? "bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg"
                      : s < step
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${s < step ? "bg-emerald-400" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Event Details</span>
            <span>Location</span>
            <span>Preferences</span>
            <span>Budget</span>
          </div>
        </div>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">{error}</div>}

        {/* Step 1: Event Details */}
        {step === 1 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>Tell us about your event</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name (Optional)</Label>
                <Input
                  id="eventName"
                  placeholder="e.g., Sarah's Birthday Celebration"
                  value={formData.eventName}
                  onChange={(e) => updateField("eventName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select value={formData.eventType} onValueChange={(v) => updateField("eventType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => updateField("eventDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Event Time</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => updateField("eventTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestCount">Number of Guests *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="guestCount"
                    type="number"
                    placeholder="50"
                    className="pl-10"
                    value={formData.guestCount}
                    onChange={(e) => updateField("guestCount", e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Event Location</CardTitle>
                  <CardDescription>Where will your event be held?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select value={formData.city} onValueChange={(v) => updateField("city", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_CITIES.map((cityData) => (
                      <SelectItem key={cityData.city} value={cityData.city}>
                        {cityData.city}, {cityData.province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">We&apos;ll match you with caterers in this area</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venueName">Venue Name (Optional)</Label>
                <Input
                  id="venueName"
                  placeholder="e.g., The Grand Ballroom"
                  value={formData.venueName}
                  onChange={(e) => updateField("venueName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venueAddress">Venue Address (Optional)</Label>
                <Textarea
                  id="venueAddress"
                  placeholder="Full address or directions"
                  value={formData.venueAddress}
                  onChange={(e) => updateField("venueAddress", e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Food Preferences</CardTitle>
                  <CardDescription>What type of food and service are you looking for?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Cuisine Preferences</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CUISINE_TYPES.map((cuisine) => (
                    <label
                      key={cuisine}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.cuisinePreferences.includes(cuisine)
                          ? "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-300"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={formData.cuisinePreferences.includes(cuisine)}
                        onCheckedChange={() => toggleArrayField("cuisinePreferences", cuisine)}
                      />
                      <span className="text-sm">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Dietary Requirements</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DIETARY_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.dietaryRequirements.includes(option)
                          ? "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-300"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={formData.dietaryRequirements.includes(option)}
                        onCheckedChange={() => toggleArrayField("dietaryRequirements", option)}
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceStyle">Service Style</Label>
                <Select value={formData.serviceStyle} onValueChange={(v) => updateField("serviceStyle", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service style" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Budget & Notes */}
        {step === 4 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Budget & Final Details</CardTitle>
                  <CardDescription>Set your budget and any additional requirements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>How would you like to set your budget?</Label>
                <RadioGroup
                  value={formData.budgetType}
                  onValueChange={(v) => updateField("budgetType", v)}
                  className="grid grid-cols-2 gap-4"
                >
                  <label
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.budgetType === "per_person"
                        ? "border-rose-400 bg-gradient-to-br from-rose-50 to-orange-50"
                        : "border-border hover:border-rose-200"
                    }`}
                  >
                    <RadioGroupItem value="per_person" className="sr-only" />
                    <Users className="w-6 h-6 text-rose-500" />
                    <span className="font-medium">Per Person</span>
                    <span className="text-xs text-muted-foreground text-center">Set budget per guest</span>
                  </label>
                  <label
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.budgetType === "total"
                        ? "border-rose-400 bg-gradient-to-br from-rose-50 to-orange-50"
                        : "border-border hover:border-rose-200"
                    }`}
                  >
                    <RadioGroupItem value="total" className="sr-only" />
                    <Wallet className="w-6 h-6 text-rose-500" />
                    <span className="font-medium">Total Budget</span>
                    <span className="text-xs text-muted-foreground text-center">Set overall budget</span>
                  </label>
                </RadioGroup>
              </div>

              {formData.budgetType === "per_person" ? (
                <div className="space-y-2">
                  <Label htmlFor="budgetPerPerson">Budget Per Person (Rands) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                    <Input
                      id="budgetPerPerson"
                      type="number"
                      placeholder="350"
                      className="pl-8"
                      value={formData.budgetPerPerson}
                      onChange={(e) => updateField("budgetPerPerson", e.target.value)}
                      min="50"
                    />
                  </div>
                  {formData.guestCount && formData.budgetPerPerson && (
                    <p className="text-sm text-muted-foreground">
                      Estimated total:{" "}
                      <span className="font-semibold text-foreground">
                        R{calculateEstimatedBudget().toLocaleString()}
                      </span>{" "}
                      for {formData.guestCount} guests
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Total Budget (Rands) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                    <Input
                      id="totalBudget"
                      type="number"
                      placeholder="25000"
                      className="pl-8"
                      value={formData.totalBudget}
                      onChange={(e) => updateField("totalBudget", e.target.value)}
                      min="1000"
                    />
                  </div>
                  {formData.guestCount && formData.totalBudget && (
                    <p className="text-sm text-muted-foreground">
                      Approximately{" "}
                      <span className="font-semibold text-foreground">
                        R{Math.round(Number.parseFloat(formData.totalBudget) / Number.parseInt(formData.guestCount))}
                      </span>{" "}
                      per guest
                    </p>
                  )}
                </div>
              )}

              {/* Budget Tier Indicator */}
              {budgetTier && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className={`w-4 h-4 ${budgetTier.color}`} />
                    <span className={`font-semibold ${budgetTier.color}`}>{budgetTier.tier} Tier</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{budgetTier.desc}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any special requirements, theme details, or preferences..."
                  value={formData.additionalNotes}
                  onChange={(e) => updateField("additionalNotes", e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canProceed()}
              className="gap-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
              className="gap-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding Caterers...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Find Caterers
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
