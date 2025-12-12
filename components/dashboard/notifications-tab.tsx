'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface EmailNotification {
  id: string
  match_id: string | null
  recipient_email: string
  notification_type: 'new_match' | 'quote_request' | 'message' | 'booking_confirmed'
  email_provider_id: string | null
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  sent_at: string | null
  error_message: string | null
  retry_count: number
  metadata: any
  created_at: string
  updated_at: string
  
  // Joined data
  match?: {
    id: string
    request?: {
      event_name: string
      event_date: string
      customer?: {
        full_name: string
        email: string
      }
    }
    caterer?: {
      business_name: string
      profile?: {
        full_name: string
      }
    }
  }
}

const NOTIFICATION_TYPES = [
  { value: 'new_match', label: 'New Match', icon: Bell, color: 'bg-blue-100 text-blue-800' },
  { value: 'quote_request', label: 'Quote Request', icon: MessageSquare, color: 'bg-purple-100 text-purple-800' },
  { value: 'message', label: 'Message', icon: Mail, color: 'bg-green-100 text-green-800' },
  { value: 'booking_confirmed', label: 'Booking Confirmed', icon: Calendar, color: 'bg-orange-100 text-orange-800' }
]

const NOTIFICATION_STATUSES = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'sent', label: 'Sent', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Failed', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { value: 'bounced', label: 'Bounced', icon: AlertCircle, color: 'bg-gray-100 text-gray-800' }
]

export function NotificationsTab() {
  const [notifications, setNotifications] = useState<EmailNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedNotification, setSelectedNotification] = useState<EmailNotification | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_notifications')
        .select(`
          *,
          match:matches(
            id,
            request:event_requests(
              event_name,
              event_date,
              customer:profiles!event_requests_customer_id_fkey(
                full_name,
                email
              )
            ),
            caterer:caterers(
              business_name,
              profile:profiles!caterers_profile_id_fkey(
                full_name
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.match?.request?.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.match?.caterer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || notification.notification_type === typeFilter
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Retry failed notification
  const retryNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_notifications')
        .update({
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Notification queued for retry')
      fetchNotifications()
    } catch (error) {
      console.error('Error retrying notification:', error)
      toast.error('Failed to retry notification')
    }
  }

  // Delete notification
  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    try {
      const { error } = await supabase
        .from('email_notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Notification deleted')
      fetchNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  // Process email queue manually
  const processEmailQueue = async () => {
    try {
      setProcessing(true)
      
      const response = await fetch('/api/notifications/process-queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-secret'}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      toast.success(`Processed ${result.processed || 0} notifications`)
      fetchNotifications()
    } catch (error) {
      console.error('Error processing queue:', error)
      toast.error('Failed to process email queue')
    } finally {
      setProcessing(false)
    }
  }

  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[0]
  }

  const getStatusConfig = (status: string) => {
    return NOTIFICATION_STATUSES.find(s => s.value === status) || NOTIFICATION_STATUSES[0]
  }

  const openDetails = (notification: EmailNotification) => {
    setSelectedNotification(notification)
    setDetailsOpen(true)
  }

  // Statistics
  const stats = {
    total: notifications.length,
    pending: notifications.filter(n => n.status === 'pending').length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    bounced: notifications.filter(n => n.status === 'bounced').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Notifications</h2>
          <p className="text-muted-foreground">
            Monitor and manage email notification delivery
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchNotifications}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={processEmailQueue}
            disabled={processing}
            size="sm"
          >
            {processing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Process Queue
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bounced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.bounced}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {NOTIFICATION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {NOTIFICATION_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading notifications...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => {
                  const typeConfig = getTypeConfig(notification.notification_type)
                  const statusConfig = getStatusConfig(notification.status)
                  const TypeIcon = typeConfig.icon
                  const StatusIcon = statusConfig.icon

                  return (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4" />
                          <Badge className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{notification.recipient_email}</div>
                          {notification.match?.caterer?.business_name && (
                            <div className="text-sm text-muted-foreground">
                              {notification.match.caterer.business_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {notification.match?.request?.event_name && (
                            <div className="font-medium">
                              {notification.match.request.event_name}
                            </div>
                          )}
                          {notification.match?.request?.event_date && (
                            <div className="text-sm text-muted-foreground">
                              {new Date(notification.match.request.event_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                          {notification.retry_count > 0 && (
                            <span className="text-xs text-muted-foreground">
                              (Retry {notification.retry_count})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {notification.sent_at ? (
                            <div>
                              <div>{new Date(notification.sent_at).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                {new Date(notification.sent_at).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not sent</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetails(notification)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {notification.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryNotification(notification.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              Detailed information about this email notification
            </DialogDescription>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="mt-1">
                    <Badge className={getTypeConfig(selectedNotification.notification_type).color}>
                      {getTypeConfig(selectedNotification.notification_type).label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusConfig(selectedNotification.status).color}>
                      {getStatusConfig(selectedNotification.status).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="text-sm font-medium">Recipient</label>
                <div className="mt-1 p-2 bg-gray-50 rounded">
                  {selectedNotification.recipient_email}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <div className="mt-1 text-sm">
                    {new Date(selectedNotification.created_at).toLocaleString()}
                  </div>
                </div>
                {selectedNotification.sent_at && (
                  <div>
                    <label className="text-sm font-medium">Sent</label>
                    <div className="mt-1 text-sm">
                      {new Date(selectedNotification.sent_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {selectedNotification.error_message && (
                <div>
                  <label className="text-sm font-medium text-red-600">Error Message</label>
                  <div className="mt-1 p-2 bg-red-50 rounded text-sm text-red-700">
                    {selectedNotification.error_message}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Metadata</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedNotification.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Provider Info */}
              {selectedNotification.email_provider_id && (
                <div>
                  <label className="text-sm font-medium">Email Provider ID</label>
                  <div className="mt-1 text-sm font-mono">
                    {selectedNotification.email_provider_id}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}