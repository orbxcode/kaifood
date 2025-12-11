"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ChefHat,
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Send,
  DollarSign,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  Mail,
  Phone,
} from "lucide-react"
import type { Match, EventRequest, Profile, Message } from "@/lib/types"
import { format, formatDistanceToNow } from "date-fns"

interface InquiryDetailsViewProps {
  match: Match & {
    event_request: EventRequest & {
      customer: Profile
    }
  }
  messages: (Message & { sender: Profile })[]
  userId: string
  catererId: string
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  viewed: "bg-blue-500/10 text-blue-600 border-blue-200",
  contacted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  quoted: "bg-primary/10 text-primary border-primary/20",
  accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  declined: "bg-muted text-muted-foreground border-border",
}

export function InquiryDetailsView({ match, messages: initialMessages, userId, catererId }: InquiryDetailsViewProps) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quotedPrice, setQuotedPrice] = useState("")
  const [quoteMessage, setQuoteMessage] = useState("")
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)

  const request = match.event_request
  const customer = request.customer

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      const supabase = createClient()

      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          match_id: match.id,
          sender_id: userId,
          content: newMessage.trim(),
        })
        .select(`*, sender:profiles(id, full_name, avatar_url)`)
        .single()

      if (error) throw error

      setMessages((prev) => [...prev, message])
      setNewMessage("")

      // Update match status to contacted if not already
      if (match.status === "viewed" || match.status === "pending") {
        await supabase.from("matches").update({ status: "contacted" }).eq("id", match.id)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quotedPrice) return

    setIsSubmittingQuote(true)
    try {
      const supabase = createClient()

      // Update match with quote
      await supabase
        .from("matches")
        .update({
          status: "quoted",
          quoted_price: Number.parseFloat(quotedPrice),
          caterer_response: quoteMessage || null,
        })
        .eq("id", match.id)

      // Send quote as message
      if (quoteMessage) {
        const { data: message } = await supabase
          .from("messages")
          .insert({
            match_id: match.id,
            sender_id: userId,
            content: `📋 Quote Submitted: R${quotedPrice} per person\n\n${quoteMessage}`,
          })
          .select(`*, sender:profiles(id, full_name, avatar_url)`)
          .single()

        if (message) {
          setMessages((prev) => [...prev, message])
        }
      }

      setShowQuoteForm(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to submit quote:", error)
    } finally {
      setIsSubmittingQuote(false)
    }
  }

  const handleDecline = async () => {
    try {
      const supabase = createClient()
      await supabase.from("matches").update({ status: "declined" }).eq("id", match.id)
      router.refresh()
    } catch (error) {
      console.error("Failed to decline:", error)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{request.event_name || request.event_type}</h1>
                <Badge variant="outline" className={statusColors[match.status]}>
                  {match.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={customer.avatar_url || undefined} />
                  <AvatarFallback>{customer.full_name?.charAt(0) || "C"}</AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">{customer.full_name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{Math.round(match.overall_score * 100)}%</div>
              <div className="text-sm text-muted-foreground">Match Score</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{format(new Date(request.event_date), "EEEE, MMMM d, yyyy")}</p>
                    {request.event_time && <p className="text-sm text-muted-foreground">{request.event_time}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{request.guest_count} guests</p>
                  </div>
                </div>

                {request.city && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{request.venue_name || request.city}</p>
                      {request.venue_address && (
                        <p className="text-sm text-muted-foreground">{request.venue_address}</p>
                      )}
                    </div>
                  </div>
                )}

                {(request.budget_min || request.budget_max) && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        R{request.budget_min || 0} - R{request.budget_max || "No limit"}
                      </p>
                      <p className="text-sm text-muted-foreground">per person budget</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.cuisine_preferences && request.cuisine_preferences.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Cuisines</p>
                    <div className="flex flex-wrap gap-1.5">
                      {request.cuisine_preferences.map((c) => (
                        <Badge key={c} variant="secondary">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {request.dietary_requirements && request.dietary_requirements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Dietary</p>
                    <div className="flex flex-wrap gap-1.5">
                      {request.dietary_requirements.map((d) => (
                        <Badge key={d} variant="outline">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {request.service_style && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Service Style</p>
                    <Badge>{request.service_style}</Badge>
                  </div>
                )}

                {request.additional_notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm">{request.additional_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {match.status !== "declined" && match.status !== "accepted" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {match.status !== "quoted" && (
                    <Button className="w-full" onClick={() => setShowQuoteForm(true)}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Submit Quote
                    </Button>
                  )}
                  {match.status === "quoted" && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Your Quote</p>
                      <p className="text-2xl font-bold text-primary">R{match.quoted_price}/pp</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full bg-transparent" onClick={handleDecline}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Messages */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground">Start the conversation with the customer</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === userId
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={msg.sender?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{msg.sender?.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                  />
                  <Button type="submit" disabled={isSending || !newMessage.trim()}>
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>

        {/* Quote Modal */}
        {showQuoteForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Submit Quote</CardTitle>
                <CardDescription>Provide your price quote for {request.guest_count} guests</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitQuote} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quotedPrice">Price per Person (R)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="quotedPrice"
                        type="number"
                        className="pl-10"
                        placeholder="250"
                        value={quotedPrice}
                        onChange={(e) => setQuotedPrice(e.target.value)}
                        required
                        min="0"
                      />
                    </div>
                    {quotedPrice && request.guest_count && (
                      <p className="text-sm text-muted-foreground">
                        Total estimate: R{(Number.parseFloat(quotedPrice) * request.guest_count).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quoteMessage">Message (optional)</Label>
                    <Textarea
                      id="quoteMessage"
                      placeholder="Add details about what's included in your quote..."
                      value={quoteMessage}
                      onChange={(e) => setQuoteMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setShowQuoteForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmittingQuote}>
                      {isSubmittingQuote ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Quote
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
