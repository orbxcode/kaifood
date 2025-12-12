'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  EyeOff, 
  Star, 
  MessageSquare,
  Search,
  Filter,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface Review {
  id: string
  match_id: string
  reviewer_id: string
  caterer_id: string
  overall_rating: number
  food_quality_rating: number | null
  service_rating: number | null
  punctuality_rating: number | null
  value_rating: number | null
  presentation_rating: number | null
  title: string | null
  content: string | null
  pros: string | null
  cons: string | null
  event_type: string | null
  guest_count: number | null
  event_date: string | null
  is_verified: boolean
  is_featured: boolean
  helpful_count: number
  not_helpful_count: number
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
  moderation_notes: string | null
  moderated_by: string | null
  moderated_at: string | null
  caterer_response: string | null
  caterer_response_date: string | null
  created_at: string
  updated_at: string
  
  // Joined data
  reviewer_name: string
  reviewer_email: string
  caterer_name: string
  caterer_business_name: string
}

const REVIEW_STATUSES = [
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'hidden', label: 'Hidden', color: 'bg-gray-100 text-gray-800' }
]

export function ReviewModeration() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [moderationDialog, setModerationDialog] = useState(false)
  const [moderationNotes, setModerationNotes] = useState('')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch reviews with joined data
  const fetchReviews = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, email),
          caterer:caterers!reviews_caterer_id_fkey(business_name),
          caterer_profile:caterers!reviews_caterer_id_fkey(
            profile:profiles!caterers_profile_id_fkey(full_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to flatten the joined fields
      const transformedData = data?.map((review: any) => ({
        ...review,
        reviewer_name: review.reviewer?.full_name || 'Unknown',
        reviewer_email: review.reviewer?.email || '',
        caterer_business_name: review.caterer?.business_name || 'Unknown Business',
        caterer_name: review.caterer_profile?.profile?.full_name || 'Unknown'
      })) || []

      setReviews(transformedData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.caterer_business_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    const matchesRating = ratingFilter === 'all' || 
      (ratingFilter === '5' && review.overall_rating === 5) ||
      (ratingFilter === '4' && review.overall_rating === 4) ||
      (ratingFilter === '3' && review.overall_rating === 3) ||
      (ratingFilter === '1-2' && review.overall_rating <= 2)
    
    return matchesSearch && matchesStatus && matchesRating
  })

  // Moderate review
  const moderateReview = async (
    reviewId: string, 
    status: Review['status'], 
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          status,
          moderation_notes: notes || null,
          moderated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (error) throw error

      toast.success(`Review ${status}`)
      setModerationDialog(false)
      setSelectedReview(null)
      setModerationNotes('')
      fetchReviews()
    } catch (error) {
      console.error('Error moderating review:', error)
      toast.error('Failed to moderate review')
    }
  }

  // Toggle featured status
  const toggleFeatured = async (reviewId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          is_featured: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (error) throw error
      toast.success(`Review ${!currentStatus ? 'featured' : 'unfeatured'}`)
      fetchReviews()
    } catch (error) {
      console.error('Error updating featured status:', error)
      toast.error('Failed to update featured status')
    }
  }

  // Toggle verified status
  const toggleVerified = async (reviewId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          is_verified: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)

      if (error) throw error
      toast.success(`Review ${!currentStatus ? 'verified' : 'unverified'}`)
      fetchReviews()
    } catch (error) {
      console.error('Error updating verified status:', error)
      toast.error('Failed to update verified status')
    }
  }

  const openModerationDialog = (review: Review) => {
    setSelectedReview(review)
    setModerationNotes(review.moderation_notes || '')
    setModerationDialog(true)
  }

  const getStatusBadge = (status: Review['status']) => {
    const statusConfig = REVIEW_STATUSES.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color}>
        {statusConfig?.label}
      </Badge>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const pendingCount = reviews.filter(r => r.status === 'pending').length
  const approvedCount = reviews.filter(r => r.status === 'approved').length
  const rejectedCount = reviews.filter(r => r.status === 'rejected').length
  const featuredCount = reviews.filter(r => r.is_featured).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Moderation</h2>
          <p className="text-muted-foreground">
            Moderate and manage customer reviews
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{featuredCount}</div>
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
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {REVIEW_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="1-2">1-2 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading reviews...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Review</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Caterer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="max-w-md">
                        {review.title && (
                          <div className="font-medium line-clamp-1">{review.title}</div>
                        )}
                        {review.content && (
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {review.content}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {review.is_verified && (
                            <Badge variant="outline" className="text-xs">
                              Verified
                            </Badge>
                          )}
                          {review.is_featured && (
                            <Badge variant="outline" className="text-xs">
                              Featured
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(review.overall_rating)}
                        <span className="ml-2 text-sm font-medium">
                          {review.overall_rating}/5
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        👍 {review.helpful_count} 👎 {review.not_helpful_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.reviewer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.reviewer_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.caterer_business_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {review.caterer_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModerationDialog(review)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {review.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moderateReview(review.id, 'approved')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moderateReview(review.id, 'rejected')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(review.id, review.is_featured)}
                        >
                          <Star 
                            className={`h-4 w-4 ${review.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Dialog */}
      <Dialog open={moderationDialog} onOpenChange={setModerationDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Review and moderate this customer feedback
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6">
              {/* Review Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedReview.title || 'Untitled Review'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(selectedReview.overall_rating)}
                    <span className="font-medium">{selectedReview.overall_rating}/5</span>
                    {getStatusBadge(selectedReview.status)}
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{new Date(selectedReview.created_at).toLocaleString()}</div>
                  <div>Event: {selectedReview.event_date ? new Date(selectedReview.event_date).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>

              {/* Detailed Ratings */}
              {(selectedReview.food_quality_rating || selectedReview.service_rating || 
                selectedReview.punctuality_rating || selectedReview.value_rating || 
                selectedReview.presentation_rating) && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {selectedReview.food_quality_rating && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Food Quality</div>
                      <div className="font-semibold">{selectedReview.food_quality_rating}/5</div>
                    </div>
                  )}
                  {selectedReview.service_rating && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Service</div>
                      <div className="font-semibold">{selectedReview.service_rating}/5</div>
                    </div>
                  )}
                  {selectedReview.punctuality_rating && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Punctuality</div>
                      <div className="font-semibold">{selectedReview.punctuality_rating}/5</div>
                    </div>
                  )}
                  {selectedReview.value_rating && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Value</div>
                      <div className="font-semibold">{selectedReview.value_rating}/5</div>
                    </div>
                  )}
                  {selectedReview.presentation_rating && (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Presentation</div>
                      <div className="font-semibold">{selectedReview.presentation_rating}/5</div>
                    </div>
                  )}
                </div>
              )}

              {/* Review Content */}
              <div className="space-y-4">
                {selectedReview.content && (
                  <div>
                    <Label className="text-sm font-medium">Review</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {selectedReview.content}
                    </div>
                  </div>
                )}

                {selectedReview.pros && (
                  <div>
                    <Label className="text-sm font-medium text-green-600">Pros</Label>
                    <div className="mt-1 p-3 bg-green-50 rounded-md">
                      {selectedReview.pros}
                    </div>
                  </div>
                )}

                {selectedReview.cons && (
                  <div>
                    <Label className="text-sm font-medium text-red-600">Cons</Label>
                    <div className="mt-1 p-3 bg-red-50 rounded-md">
                      {selectedReview.cons}
                    </div>
                  </div>
                )}
              </div>

              {/* Caterer Response */}
              {selectedReview.caterer_response && (
                <div>
                  <Label className="text-sm font-medium">Caterer Response</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    {selectedReview.caterer_response}
                    <div className="text-xs text-muted-foreground mt-2">
                      {selectedReview.caterer_response_date && 
                        new Date(selectedReview.caterer_response_date).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Moderation Notes */}
              <div>
                <Label htmlFor="moderation-notes">Moderation Notes</Label>
                <Textarea
                  id="moderation-notes"
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder="Add notes about this review..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleVerified(selectedReview.id, selectedReview.is_verified)}
                  >
                    {selectedReview.is_verified ? 'Unverify' : 'Verify'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFeatured(selectedReview.id, selectedReview.is_featured)}
                  >
                    {selectedReview.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedReview.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => moderateReview(selectedReview.id, 'rejected', moderationNotes)}
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => moderateReview(selectedReview.id, 'approved', moderationNotes)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                    </>
                  )}
                  {selectedReview.status !== 'pending' && (
                    <Button
                      onClick={() => moderateReview(selectedReview.id, 'hidden', moderationNotes)}
                      variant="outline"
                    >
                      Hide Review
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}