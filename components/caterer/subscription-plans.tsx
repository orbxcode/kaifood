"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChefHat, Check, ArrowLeft, Loader2, Crown, Rocket, Building2, Sparkles } from "lucide-react"
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/constants"

interface SubscriptionPlansProps {
  caterer: {
    id: string
    subscription_tier: SubscriptionTier
    subscription_status: string
    subscription_expires_at: string | null
  } | null
}

const tierIcons = {
  basic: Rocket,
  pro: Crown,
  business: Building2,
}

const tierGradients = {
  basic: "from-emerald-400 to-teal-500",
  pro: "from-primary to-orange-400",
  business: "from-amber-400 to-rose-500",
}

const tierShadows = {
  basic: "shadow-emerald-500/25",
  pro: "shadow-primary/25",
  business: "shadow-amber-500/25",
}

export function SubscriptionPlans({ caterer }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<SubscriptionTier | null>(null)
  const currentTier = caterer?.subscription_tier || "basic"
  const isActive = caterer?.subscription_status === "active"

  const handleSubscribe = async (tier: SubscriptionTier) => {
    setLoading(tier)
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json()

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        alert(data.error || "Failed to initialize payment")
      }
    } catch (error) {
      console.error("Subscription error:", error)
      alert("Failed to process subscription")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-rose-50/50">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/caterer/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/25">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">Kai</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">
            <span className="bg-gradient-to-r from-primary via-orange-500 to-rose-500 bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your business. Higher tiers get access to larger events and more leads.
          </p>
          {isActive && (
            <Badge className="mt-4 bg-gradient-to-r from-primary/10 to-orange-400/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Current Plan: {SUBSCRIPTION_TIERS[currentTier].name}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(Object.entries(SUBSCRIPTION_TIERS) as [SubscriptionTier, typeof SUBSCRIPTION_TIERS.basic][]).map(
            ([key, tier]) => {
              const Icon = tierIcons[key]
              const isCurrentPlan = key === currentTier && isActive
              const isUpgrade =
                !isActive ||
                (key === "pro" && currentTier === "basic") ||
                (key === "business" && (currentTier === "basic" || currentTier === "pro"))

              return (
                <Card
                  key={key}
                  className={`relative overflow-hidden transition-all bg-white/80 backdrop-blur-sm ${
                    key === "pro" ? "border-primary/50 shadow-xl scale-[1.02]" : "border-border/50 shadow-lg"
                  } ${isCurrentPlan ? "ring-2 ring-primary" : ""} hover:shadow-xl`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tierGradients[key]}`} />

                  {key === "pro" && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-orange-400 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-6">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tierGradients[key]} flex items-center justify-center mb-4 shadow-lg ${tierShadows[key]}`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription>
                      {key === "basic" && "Perfect for getting started"}
                      {key === "pro" && "For growing catering businesses"}
                      {key === "business" && "For established caterers"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div>
                      <span
                        className={`text-4xl font-bold bg-gradient-to-r ${tierGradients[key]} bg-clip-text text-transparent`}
                      >
                        {tier.priceDisplay}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground">Event Budget Range:</span>
                      </div>
                      <p className="text-foreground">
                        {tier.minBudget > 0 ? `R${tier.minBudget.toLocaleString()}` : "R0"} -{" "}
                        {tier.maxBudget ? `R${tier.maxBudget.toLocaleString()}` : "Unlimited"}
                      </p>
                    </div>

                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-br ${tierGradients[key]} flex items-center justify-center flex-shrink-0 mt-0.5`}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        key === "pro"
                          ? "bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 shadow-lg shadow-primary/25"
                          : ""
                      }`}
                      variant={key === "pro" ? "default" : "outline"}
                      disabled={isCurrentPlan || loading !== null}
                      onClick={() => handleSubscribe(key)}
                    >
                      {loading === key ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : isUpgrade ? (
                        "Upgrade"
                      ) : (
                        "Downgrade"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            },
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include access to our AI-powered matching system and secure payment processing via Paystack.
            <br />
            Cancel anytime. Questions?{" "}
            <Link href="/support" className="text-primary font-medium hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
