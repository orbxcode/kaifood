"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ChefHat,
  ArrowLeft,
  Send,
  Loader2,
  Calendar,
  Users,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle2,
} from "lucide-react"
import type { Match, Message, Profile, Caterer, EventRequest } from "@/lib/types"
import { format, formatDistanceToNow } from "date-fns"

interface ChatInterfaceProps {
  match: Match & {
    caterer: Caterer & { profile: Profile }
    event_request: EventRequest & { customer: Profile }
  }
  messages: (Message & { sender: Profile })[]
  currentUser: Profile
  isCustomer: boolean
}

export function ChatInterface({ match, messages: initialMessages, currentUser, isCustomer }: ChatInterfaceProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const otherParty = isCustomer ? match.caterer.profile : match.event_request.customer
  const caterer = match.caterer
  const request = match.event_request

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${match.id}`,
        },
        async (payload) => {
          const { data: newMsg } = await supabase
            .from("messages")
            .select("*, sender:profiles(*)")
            .eq("id", payload.new.id)
            .single()

          if (newMsg && newMsg.sender_id !== currentUser.id) {
            setMessages((prev) => [...prev, newMsg])
            // Mark as read
            await supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [match.id, currentUser.id, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          match_id: match.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
        })
        .select("*, sender:profiles(*)")
        .single()

      if (error) throw error

      setMessages((prev) => [...prev, message])
      setNewMessage("")

      // Update match status to contacted if pending/viewed
      if (match.status === "pending" || match.status === "viewed") {
        await supabase.from("matches").update({ status: "contacted" }).eq("id", match.id)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const backUrl = isCustomer ? `/customer/requests/${request.id}` : `/caterer/inquiries/${match.id}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href={backUrl} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Avatar className="w-10 h-10 ring-2 ring-white shadow-md">
                <AvatarImage src={otherParty.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-rose-400 to-orange-400 text-white">
                  {isCustomer ? caterer.business_name?.charAt(0) : otherParty.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-foreground">
                  {isCustomer ? caterer.business_name : otherParty.full_name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {request.event_name || request.event_type} • {format(new Date(request.event_date), "MMM d")}
                </p>
              </div>
            </div>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-4xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center py-12">
                <div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Start the conversation</h3>
                  <p className="text-muted-foreground max-w-sm">
                    {isCustomer
                      ? `Send a message to ${caterer.business_name} about your event`
                      : `Introduce yourself to ${otherParty.full_name} and discuss their event`}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === currentUser.id
                return (
                  <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={msg.sender?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-rose-400 to-orange-400 text-white">
                        {msg.sender?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 shadow-sm ${
                          isOwn
                            ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-tr-sm"
                            : "bg-white rounded-tl-sm"
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
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-border/50 bg-white/80 backdrop-blur-sm p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending}
                className="flex-1 bg-white"
              />
              <Button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar - Event/Contact Info */}
        <div className="hidden lg:block w-80 border-l border-border/50 bg-white/50 p-4 space-y-4 overflow-y-auto">
          {/* Event Details */}
          <Card className="border-0 shadow-lg bg-white/80">
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-sm">Event Details</h3>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(request.event_date), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{request.guest_count} guests</span>
              </div>
              {request.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{request.city}</span>
                </div>
              )}
              {match.quoted_price && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Quoted Price</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                    R{match.quoted_price}/pp
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border-0 shadow-lg bg-white/80">
            <CardHeader className="pb-2">
              <h3 className="font-semibold text-sm">{isCustomer ? "Caterer Contact" : "Customer Contact"}</h3>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isCustomer ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={caterer.profile.avatar_url || undefined} />
                      <AvatarFallback>{caterer.business_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{caterer.business_name}</p>
                      {caterer.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs">{caterer.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/caterers/${caterer.id}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      View Full Profile
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{otherParty.email}</span>
                  </div>
                  {otherParty.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{otherParty.phone}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Match Status */}
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Match Status</span>
                <Badge
                  variant="outline"
                  className={
                    match.status === "accepted"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-rose-100 text-rose-700 border-rose-200"
                  }
                >
                  {match.status === "accepted" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {match.status}
                </Badge>
              </div>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                  {Math.round((match.overall_score || match.score || 0) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Match Score</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
