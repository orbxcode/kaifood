'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Camera, 
  Calendar,
  Users,
  MessageSquare,
  Award,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  overall_rating: number;
  food_quality_rating?: number;
  service_rating?: number;
  punctuality_rating?: number;
  value_rating?: number;
  presentation_rating?: number;
  title?: string;
  content: string;
  pros?: string;
  cons?: string;
  event_type?: string;
  guest_count?: number;
  event_date?: string;
  helpful_count: number;
  not_helpful_count: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  review_images?: string[];
  caterer_response?: string;
  caterer_response_date?: string;
  created_at: string;
}

interface ReviewSystemProps {
  catererId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  canReview?: boolean;
  onReviewSubmit?: () => void;
}

export function ReviewSystem({ 
  catererId, 
  reviews, 
  averageRating, 
  totalReviews,
  canReview = false,
  onReviewSubmit 
}: ReviewSystemProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.overall_rating === rating).length,
    percentage: totalReviews > 0 ? (reviews.filter(r => r.overall_rating === rating).length / totalReviews) * 100 : 0
  }));

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'highest':
        return b.overall_rating - a.overall_rating;
      case 'lowest':
        return a.overall_rating - b.overall_rating;
      case 'helpful':
        return b.helpful_count - a.helpful_count;
      default:
        return 0;
    }
  });

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful: isHelpful }),
      });

      if (response.ok) {
        toast.success('Thank you for your feedback!');
        onReviewSubmit?.();
      }
    } catch (error) {
      toast.error('Failed to submit vote');
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= averageRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground">
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Write Review Button */}
          {canReview && (
            <div className="mt-6 text-center">
              <Button onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <ReviewForm
          catererId={catererId}
          onClose={() => setShowReviewForm(false)}
          onSuccess={() => {
            setShowReviewForm(false);
            onReviewSubmit?.();
          }}
        />
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reviews ({totalReviews})</CardTitle>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {sortedReviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your experience with this caterer
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Individual Review Card Component
function ReviewCard({ 
  review, 
  onVote 
}: { 
  review: Review; 
  onVote: (reviewId: string, isHelpful: boolean) => void;
}) {
  const categoryRatings = [
    { label: 'Food Quality', value: review.food_quality_rating },
    { label: 'Service', value: review.service_rating },
    { label: 'Punctuality', value: review.punctuality_rating },
    { label: 'Value', value: review.value_rating },
    { label: 'Presentation', value: review.presentation_rating },
  ].filter(rating => rating.value);

  return (
    <div className="border-b pb-6 last:border-b-0">
      {/* Review Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar>
          <AvatarImage src={review.reviewer_avatar} />
          <AvatarFallback>
            {review.reviewer_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{review.reviewer_name}</h4>
            {review.event_type && (
              <Badge variant="outline" className="text-xs">
                {review.event_type}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.overall_rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Event Details */}
          {(review.guest_count || review.event_date) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              {review.guest_count && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {review.guest_count} guests
                </div>
              )}
              {review.event_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(review.event_date).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Title */}
      {review.title && (
        <h5 className="font-medium mb-2">{review.title}</h5>
      )}

      {/* Review Content */}
      <div className="prose prose-sm max-w-none mb-4">
        <p>{review.content}</p>
      </div>

      {/* Pros and Cons */}
      {(review.pros || review.cons) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {review.pros && (
            <div>
              <h6 className="font-medium text-green-700 mb-1">Pros</h6>
              <p className="text-sm text-green-600">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div>
              <h6 className="font-medium text-red-700 mb-1">Cons</h6>
              <p className="text-sm text-red-600">{review.cons}</p>
            </div>
          )}
        </div>
      )}

      {/* Category Ratings */}
      {categoryRatings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {categoryRatings.map((rating) => (
            <div key={rating.label} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">{rating.label}</span>
                <span className="font-medium">{rating.value}/5</span>
              </div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= (rating.value || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Images */}
      {review.review_images && review.review_images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {review.review_images.map((image, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden">
              <img
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Caterer Response */}
      {review.caterer_response && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Response from Caterer</span>
            <span className="text-sm text-blue-600">
              {formatDistanceToNow(new Date(review.caterer_response_date!), { addSuffix: true })}
            </span>
          </div>
          <p className="text-blue-800 text-sm">{review.caterer_response}</p>
        </div>
      )}

      {/* Helpfulness Voting */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Was this review helpful?</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVote(review.id, true)}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="h-3 w-3" />
            {review.helpful_count}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVote(review.id, false)}
            className="flex items-center gap-1"
          >
            <ThumbsDown className="h-3 w-3" />
            {review.not_helpful_count}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Review Form Component
function ReviewForm({ 
  catererId, 
  onClose, 
  onSuccess 
}: { 
  catererId: string; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    overall_rating: 5,
    food_quality_rating: 5,
    service_rating: 5,
    punctuality_rating: 5,
    value_rating: 5,
    presentation_rating: 5,
    title: '',
    content: '',
    pros: '',
    cons: '',
    event_type: '',
    guest_count: '',
    event_date: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/caterers/${catererId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
        }),
      });

      if (response.ok) {
        toast.success('Review submitted successfully!');
        onSuccess();
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const RatingInput = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void; 
  }) => (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1"
          >
            <Star
              className={`h-5 w-5 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{value}/5</span>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <RatingInput
            label="Overall Rating"
            value={formData.overall_rating}
            onChange={(value) => setFormData({ ...formData, overall_rating: value })}
          />

          {/* Category Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RatingInput
              label="Food Quality"
              value={formData.food_quality_rating}
              onChange={(value) => setFormData({ ...formData, food_quality_rating: value })}
            />
            <RatingInput
              label="Service"
              value={formData.service_rating}
              onChange={(value) => setFormData({ ...formData, service_rating: value })}
            />
            <RatingInput
              label="Punctuality"
              value={formData.punctuality_rating}
              onChange={(value) => setFormData({ ...formData, punctuality_rating: value })}
            />
            <RatingInput
              label="Value for Money"
              value={formData.value_rating}
              onChange={(value) => setFormData({ ...formData, value_rating: value })}
            />
            <RatingInput
              label="Presentation"
              value={formData.presentation_rating}
              onChange={(value) => setFormData({ ...formData, presentation_rating: value })}
            />
          </div>

          {/* Review Content */}
          <div>
            <label className="text-sm font-medium">Review Title (Optional)</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summarize your experience"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Your Review</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Share your experience with this caterer"
              rows={4}
              required
            />
          </div>

          {/* Pros and Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">What did you like? (Optional)</label>
              <Textarea
                value={formData.pros}
                onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                placeholder="Highlight the positives"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Areas for improvement (Optional)</label>
              <Textarea
                value={formData.cons}
                onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
                placeholder="Constructive feedback"
                rows={2}
              />
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Event Type</label>
              <Input
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                placeholder="Wedding, Birthday, etc."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Number of Guests</label>
              <Input
                type="number"
                value={formData.guest_count}
                onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                placeholder="50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Event Date</label>
              <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}