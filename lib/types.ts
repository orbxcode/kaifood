// Kai Platform Type Definitions

// ============ Constants ============

export const CUISINE_TYPES = [
  "Italian",
  "French",
  "Japanese",
  "Chinese",
  "Indian",
  "Mexican",
  "Thai",
  "Mediterranean",
  "American",
  "African",
  "Middle Eastern",
  "Korean",
  "Vietnamese",
  "Greek",
  "Spanish",
  "Brazilian",
  "Fusion",
  "Farm-to-Table",
  "Seafood",
  "BBQ & Grill",
] as const

export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Kosher",
  "Dairy-Free",
  "Nut-Free",
  "Keto",
  "Paleo",
  "Low-Sodium",
] as const

export const SERVICE_STYLES = [
  "Buffet",
  "Plated Service",
  "Family Style",
  "Food Stations",
  "Cocktail/Canapés",
  "Food Truck",
  "Private Chef",
  "Drop-off",
] as const

export const EVENT_TYPES = [
  "Wedding",
  "Corporate Event",
  "Birthday Party",
  "Anniversary",
  "Baby Shower",
  "Engagement Party",
  "Graduation",
  "Holiday Party",
  "Fundraiser",
  "Conference",
  "Private Dinner",
  "Cocktail Party",
  "Brunch",
  "Memorial Service",
  "Other",
] as const

// ============ Database Types ============

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  user_type: "customer" | "caterer"
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Caterer {
  id: string
  profile_id: string
  business_name: string | null
  description: string | null
  cuisines: string[]
  dietary_options: string[]
  service_styles: string[]
  event_types: string[]
  min_guests: number | null
  max_guests: number | null
  price_per_person_min: number | null
  price_per_person_max: number | null
  city: string | null
  service_radius_km: number | null
  latitude: number | null
  longitude: number | null
  profile_complete: boolean
  is_active: boolean
  rating: number | null
  review_count: number
  created_at: string
  updated_at: string
  // Joined fields
  profile?: Profile
}

export interface EventRequest {
  id: string
  customer_id: string
  event_name: string | null
  event_type: string
  event_date: string
  event_time: string | null
  guest_count: number
  venue_name: string | null
  venue_address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  cuisine_preferences: string[]
  dietary_requirements: string[]
  service_style: string | null
  budget_min: number | null
  budget_max: number | null
  additional_notes: string | null
  status: "pending" | "matching" | "matched" | "booked" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  // Joined fields
  customer?: Profile
  matches?: Match[]
}

export interface Match {
  id: string
  request_id: string
  caterer_id: string
  score: number
  cuisine_score: number | null
  dietary_score: number | null
  capacity_score: number | null
  location_score: number | null
  semantic_score: number | null
  status: "pending" | "viewed" | "interested" | "quoted" | "accepted" | "declined"
  quoted_price: number | null
  quote_notes: string | null
  caterer_message: string | null
  created_at: string
  updated_at: string
  // Joined fields
  caterer?: Caterer & { profile?: Profile }
  request?: EventRequest
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  // Joined fields
  sender?: Profile
}

export interface Review {
  id: string
  caterer_id: string
  customer_id: string
  match_id: string
  rating: number
  comment: string | null
  created_at: string
  // Joined fields
  customer?: Profile
}

export interface MenuItem {
  id: string
  caterer_id: string
  name: string
  description: string | null
  price: number | null
  category: string | null
  dietary_tags: string[]
  image_url: string | null
  is_available: boolean
  created_at: string
}

// ============ API Types ============

export interface MatchingResult {
  caterer: Caterer
  score: number
  breakdown: {
    cuisine: number
    dietary: number
    capacity: number
    location: number
    semantic: number
  }
  reasoning?: string
}

export interface AIExtractionResult {
  cuisines: string[]
  specialties: string[]
  priceRange: { min: number; max: number }
  serviceStyles: string[]
  dietaryOptions: string[]
  summary: string
}
