"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChefHat, CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function SubscriptionCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const reference = searchParams.get("reference")
  const trxref = searchParams.get("trxref")

  useEffect(() => {
    const verifyPayment = async () => {
      const ref = reference || trxref
      if (!ref) {
        setStatus("error")
        return
      }

      try {
        const response = await fetch(`/api/paystack/verify?reference=${ref}`)
        const data = await response.json()

        if (data.success) {
          setStatus("success")
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push("/caterer/dashboard")
          }, 3000)
        } else {
          setStatus("error")
        }
      } catch {
        setStatus("error")
      }
    }

    verifyPayment()
  }, [reference, trxref, router])

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Kai</span>
          </Link>

          {status === "loading" && (
            <>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>Please wait while we confirm your subscription...</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-emerald-600">Subscription Activated!</CardTitle>
              <CardDescription>
                Your subscription is now active. You'll start receiving job matches based on your tier.
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Payment Failed</CardTitle>
              <CardDescription>
                We couldn't verify your payment. Please try again or contact support if the issue persists.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "success" && (
            <p className="text-sm text-center text-muted-foreground">
              Redirecting you to your dashboard in a few seconds...
            </p>
          )}

          <div className="flex gap-3">
            {status === "error" && (
              <Button variant="outline" className="flex-1 bg-transparent" asChild>
                <Link href="/caterer/subscription">Try Again</Link>
              </Button>
            )}
            <Button className="flex-1" asChild>
              <Link href="/caterer/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
