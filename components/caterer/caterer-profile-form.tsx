"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ChefHat, Loader2, ArrowLeft, Save, MapPin, DollarSign, Users } from "lucide-react"
import { CUISINE_TYPES, DIETARY_OPTIONS, SERVICE_STYLES, EVENT_TYPES } from "@/lib/types"
import type { Profile, Caterer } from "@/lib/types"

interface CatererProfileFormProps {
  profile: Profile
  caterer: Caterer | null
}

export function CatererProfileForm({ profile, caterer }: CatererProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    businessName: caterer?.business_name || "",
    description: caterer?.description || "",
    cuisineTypes: caterer?.cuisine_types || [],
    dietaryCapabilities: caterer?.dietary_capabilities || [],
    serviceStyles: caterer?.service_styles || [],
    eventTypes: caterer?.event_types || [],
    minGuests: caterer?.min_guests?.toString() || "10",
    maxGuests: caterer?.max_guests?.toString() || "500",
    priceRangeMin: caterer?.price_range_min?.toString() || "",
    priceRangeMax: caterer?.price_range_max?.toString() || "",
    address: caterer?.address || "",
    city: caterer?.city || "",
    state: caterer?.state || "",
    postalCode: caterer?.postal_code || "",
    serviceRadiusKm: caterer?.service_radius_km?.toString() || "50",
  })

  const toggleArrayField = (
    field: "cuisineTypes" | "dietaryCapabilities" | "serviceStyles" | "eventTypes",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      // Calculate profile completeness
      let completeness = 0
      if (formData.businessName) completeness += 15
      if (formData.description && formData.description.length > 50) completeness += 15
      if (formData.cuisineTypes.length > 0) completeness += 15
      if (formData.dietaryCapabilities.length > 0) completeness += 10
      if (formData.serviceStyles.length > 0) completeness += 10
      if (formData.eventTypes.length > 0) completeness += 10
      if (formData.priceRangeMin && formData.priceRangeMax) completeness += 10
      if (formData.city) completeness += 15

      const updateData = {
        business_name: formData.businessName,
        description: formData.description || null,
        cuisine_types: formData.cuisineTypes,
        dietary_capabilities: formData.dietaryCapabilities,
        service_styles: formData.serviceStyles,
        event_types: formData.eventTypes,
        min_guests: Number.parseInt(formData.minGuests) || 10,
        max_guests: Number.parseInt(formData.maxGuests) || 500,
        price_range_min: formData.priceRangeMin ? Number.parseFloat(formData.priceRangeMin) : null,
        price_range_max: formData.priceRangeMax ? Number.parseFloat(formData.priceRangeMax) : null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        postal_code: formData.postalCode || null,
        service_radius_km: Number.parseInt(formData.serviceRadiusKm) || 50,
        profile_completeness: completeness,
      }

      const { error: updateError } = await supabase.from("caterers").update(updateData).eq("profile_id", profile.id)

      if (updateError) throw updateError

      // Trigger AI extraction and embedding update
      await fetch("/api/caterer/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catererId: caterer?.id }),
      })

      setSuccess(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/caterer/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Business Profile</h1>
          <p className="text-muted-foreground mt-1">Complete your profile to start receiving customer matches</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell customers about your catering business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Your Business Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell customers about your catering services, specialties, and what makes you unique..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cuisine & Dietary */}
          <Card>
            <CardHeader>
              <CardTitle>Cuisine & Dietary</CardTitle>
              <CardDescription>What types of food do you offer?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Cuisine Types</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {CUISINE_TYPES.map((cuisine) => (
                    <label
                      key={cuisine}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.cuisineTypes.includes(cuisine) ? "bg-primary/5 border-primary" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={formData.cuisineTypes.includes(cuisine)}
                        onCheckedChange={() => toggleArrayField("cuisineTypes", cuisine)}
                      />
                      <span className="text-sm">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Dietary Capabilities</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DIETARY_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.dietaryCapabilities.includes(option) ? "bg-primary/5 border-primary" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={formData.dietaryCapabilities.includes(option)}
                        onCheckedChange={() => toggleArrayField("dietaryCapabilities", option)}
                      />
                      <span className="text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Service Styles & Events</CardTitle>
              <CardDescription>What services do you provide?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Service Styles</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SERVICE_STYLES.map((style) => (
                    <label
                      key={style}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.serviceStyles.includes(style) ? "bg-primary/5 border-primary" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={formData.serviceStyles.includes(style)}
                        onCheckedChange={() => toggleArrayField("serviceStyles", style)}
                      />
                      <span className="text-sm">{style}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Event Types</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {EVENT_TYPES.map((event) => (
                    <label
                      key={event}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.eventTypes.includes(event) ? "bg-primary/5 border-primary" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={formData.eventTypes.includes(event)}
                        onCheckedChange={() => toggleArrayField("eventTypes", event)}
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Capacity & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Capacity & Pricing</CardTitle>
              <CardDescription>Set your capacity and price range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minGuests">Minimum Guests</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="minGuests"
                      type="number"
                      className="pl-10"
                      value={formData.minGuests}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minGuests: e.target.value }))}
                      min="1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGuests">Maximum Guests</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="maxGuests"
                      type="number"
                      className="pl-10"
                      value={formData.maxGuests}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maxGuests: e.target.value }))}
                      min="1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceRangeMin">Min Price (R per person)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="priceRangeMin"
                      type="number"
                      className="pl-10"
                      value={formData.priceRangeMin}
                      onChange={(e) => setFormData((prev) => ({ ...prev, priceRangeMin: e.target.value }))}
                      placeholder="100"
                      min="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceRangeMax">Max Price (R per person)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="priceRangeMax"
                      type="number"
                      className="pl-10"
                      value={formData.priceRangeMax}
                      onChange={(e) => setFormData((prev) => ({ ...prev, priceRangeMax: e.target.value }))}
                      placeholder="500"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where are you based?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Cape Town"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                    placeholder="Western Cape"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="8001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceRadiusKm">Service Radius (km)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="serviceRadiusKm"
                    type="number"
                    className="pl-10"
                    value={formData.serviceRadiusKm}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serviceRadiusKm: e.target.value }))}
                    min="1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You will only be matched with events within this distance
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          {error && <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">{error}</div>}
          {success && (
            <div className="text-sm text-emerald-600 bg-emerald-500/10 px-4 py-3 rounded-lg">
              Profile updated successfully! Your embeddings are being updated.
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
