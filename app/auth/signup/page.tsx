"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { ChefHat, Loader2, Users, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"

function SignupForm() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get("type") as "customer" | "caterer" | null

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [userType, setUserType] = useState<"customer" | "caterer">(initialType || "customer")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            user_type: userType,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user && !data.session) {
        router.push("/auth/signup-success")
      } else if (data.session) {
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-bl from-primary/20 to-rose-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-tr from-orange-200/30 to-amber-200/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-400 shadow-lg shadow-primary/25">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Kai</span>
          </Link>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>Get started with Kai today</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  {/* User Type Selection */}
                  <div className="grid gap-2">
                    <Label>I am a...</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType("customer")}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                          userType === "customer"
                            ? "border-primary bg-gradient-to-br from-primary/10 to-orange-400/10 shadow-md"
                            : "border-muted hover:border-primary/30 bg-white/50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            userType === "customer" ? "bg-gradient-to-br from-primary to-orange-400" : "bg-muted",
                          )}
                        >
                          <Users
                            className={cn("h-5 w-5", userType === "customer" ? "text-white" : "text-muted-foreground")}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            userType === "customer" ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          Customer
                        </span>
                        <span className="text-xs text-muted-foreground text-center">Looking for caterers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType("caterer")}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                          userType === "caterer"
                            ? "border-primary bg-gradient-to-br from-primary/10 to-orange-400/10 shadow-md"
                            : "border-muted hover:border-primary/30 bg-white/50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            userType === "caterer" ? "bg-gradient-to-br from-primary to-orange-400" : "bg-muted",
                          )}
                        >
                          <UtensilsCrossed
                            className={cn("h-5 w-5", userType === "caterer" ? "text-white" : "text-muted-foreground")}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            userType === "caterer" ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          Caterer
                        </span>
                        <span className="text-xs text-muted-foreground text-center">Offering services</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white/50"
                    />
                  </div>

                  {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 shadow-lg shadow-primary/25"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      `Sign up as ${userType === "customer" ? "Customer" : "Caterer"}`
                    )}
                  </Button>
                </div>

                <div className="mt-6 text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary font-medium underline underline-offset-4 hover:text-primary/80"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
