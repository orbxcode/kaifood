// AI-powered matching utilities using Vercel AI Gateway

export interface MatchCriteria {
  cuisines: string[]
  dietaryRequirements: string[]
  guestCount: number
  budgetMin: number
  budgetMax: number
  eventType: string
  serviceStyle: string
  location: {
    lat: number
    lng: number
  }
}

export interface CatererProfile {
  id: string
  businessName: string
  cuisines: string[]
  serviceStyles: string[]
  minGuests: number
  maxGuests: number
  minPricePerPerson: number
  maxPricePerPerson: number
  averageRating: number | null
  description: string
  location: {
    lat: number
    lng: number
  }
}

// Haversine formula for geographic distance
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Calculate basic match score before AI enhancement
export function calculateBaseScore(criteria: MatchCriteria, caterer: CatererProfile): number {
  let score = 0
  const weights = {
    cuisine: 30,
    capacity: 20,
    price: 25,
    distance: 15,
    rating: 10,
  }

  // Cuisine overlap
  const cuisineOverlap = criteria.cuisines.filter((c) => caterer.cuisines.includes(c)).length
  const cuisineScore =
    criteria.cuisines.length > 0 ? (cuisineOverlap / criteria.cuisines.length) * weights.cuisine : weights.cuisine * 0.5
  score += cuisineScore

  // Capacity fit
  if (criteria.guestCount >= caterer.minGuests && criteria.guestCount <= caterer.maxGuests) {
    score += weights.capacity
  } else if (criteria.guestCount < caterer.minGuests) {
    score += weights.capacity * 0.5
  }

  // Price alignment
  const budgetPerPerson = criteria.budgetMax / criteria.guestCount
  if (budgetPerPerson >= caterer.minPricePerPerson && budgetPerPerson <= caterer.maxPricePerPerson * 1.2) {
    score += weights.price
  } else if (budgetPerPerson >= caterer.minPricePerPerson * 0.8) {
    score += weights.price * 0.7
  }

  // Distance (within 50 miles is ideal)
  if (criteria.location && caterer.location) {
    const distance = calculateDistance(
      criteria.location.lat,
      criteria.location.lng,
      caterer.location.lat,
      caterer.location.lng,
    )
    if (distance <= 25) {
      score += weights.distance
    } else if (distance <= 50) {
      score += weights.distance * 0.7
    } else if (distance <= 100) {
      score += weights.distance * 0.3
    }
  }

  // Rating bonus
  if (caterer.averageRating) {
    score += (caterer.averageRating / 5) * weights.rating
  }

  return Math.round(score)
}
