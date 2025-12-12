import { Redis } from "@upstash/redis"

// Initialize Redis (optional)
let redis: Redis | null = null
try {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (redisUrl && redisToken) {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })
  }
} catch (error) {
  console.warn("Upstash Redis not configured, eval operations will be skipped")
}

// Types for the eval system
export interface LocationEval {
  id: string
  input: string
  normalizedCity: string
  normalizedProvince: string
  confidence: "high" | "medium" | "low"
  source: "alias" | "learned" | "ai"
  timestamp: number
  verified?: boolean
  correctedCity?: string
  correctedProvince?: string
}

export interface MatchingEval {
  id: string
  requestId: string
  totalBudget: number
  assignedTier: "basic" | "pro" | "business"
  caterersMatched: number
  caterersContacted: number
  successfulBooking: boolean
  customerRating?: number
  timestamp: number
}

export interface LearnedLocation {
  alias: string
  city: string
  province: string
  lat: number
  lng: number
  useCount: number
  lastUsed: number
  addedBy: "system" | "admin" | "user_correction"
}

// Keys for Redis storage
const KEYS = {
  locationEvals: "kai:evals:location",
  matchingEvals: "kai:evals:matching",
  learnedLocations: "kai:learned:locations",
  locationStats: "kai:stats:location",
  matchingStats: "kai:stats:matching",
}

// Helper function to check if Redis is available
function isRedisAvailable(): boolean {
  return redis !== null
}

// ========== LOCATION EVALS ==========

export async function logLocationEval(eval_: Omit<LocationEval, "id" | "timestamp">): Promise<string> {
  const id = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  
  if (!isRedisAvailable()) {
    console.warn("Redis not available, location eval not logged")
    return id
  }

  const fullEval: LocationEval = {
    ...eval_,
    id,
    timestamp: Date.now(),
  }

  // Store in a sorted set by timestamp for easy retrieval
  await redis!.zadd(KEYS.locationEvals, {
    score: fullEval.timestamp,
    member: JSON.stringify(fullEval),
  })

  // Update stats
  await updateLocationStats(eval_.confidence, eval_.source)

  return id
}

export async function getLocationEvals(limit = 100): Promise<LocationEval[]> {
  if (!isRedisAvailable()) {
    return []
  }

  const results = await redis!.zrange(KEYS.locationEvals, -limit, -1, { rev: true })
  return results.map((r) => (typeof r === "string" ? JSON.parse(r) : r))
}

export async function correctLocationEval(
  evalId: string,
  correctedCity: string,
  correctedProvince: string,
  lat: number,
  lng: number,
): Promise<void> {
  if (!isRedisAvailable()) return

  // Find and update the eval
  const evals = await getLocationEvals(1000)
  const evalToCorrect = evals.find((e) => e.id === evalId)

  if (evalToCorrect) {
    // Learn from this correction
    await learnLocation({
      alias: evalToCorrect.input.toLowerCase().trim(),
      city: correctedCity,
      province: correctedProvince,
      lat,
      lng,
      useCount: 1,
      lastUsed: Date.now(),
      addedBy: "user_correction",
    })

    // Increment correction stats
    await redis!.hincrby(KEYS.locationStats, "corrections", 1)
  }
}

async function updateLocationStats(confidence: string, source: string): Promise<void> {
  if (!isRedisAvailable()) return

  await redis!.hincrby(KEYS.locationStats, "total", 1)
  await redis!.hincrby(KEYS.locationStats, `confidence_${confidence}`, 1)
  await redis!.hincrby(KEYS.locationStats, `source_${source}`, 1)
}

export async function getLocationStats(): Promise<Record<string, number>> {
  if (!isRedisAvailable()) {
    return {}
  }

  const stats = await redis!.hgetall(KEYS.locationStats)
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(stats || {})) {
    result[key] = typeof value === "number" ? value : Number.parseInt(value as string, 10) || 0
  }
  return result
}

// ========== LEARNED LOCATIONS (Self-Learning) ==========

export async function learnLocation(location: LearnedLocation): Promise<void> {
  if (!isRedisAvailable()) return

  const key = location.alias.toLowerCase().trim()
  await redis!.hset(KEYS.learnedLocations, {
    [key]: JSON.stringify(location),
  })
}

export async function getLearnedLocation(alias: string): Promise<LearnedLocation | null> {
  if (!isRedisAvailable()) return null

  const key = alias.toLowerCase().trim()
  const result = await redis!.hget(KEYS.learnedLocations, key)
  if (!result) return null
  return typeof result === "string" ? JSON.parse(result) : result
}

export async function getAllLearnedLocations(): Promise<LearnedLocation[]> {
  if (!isRedisAvailable()) return []

  const all = await redis!.hgetall(KEYS.learnedLocations)
  if (!all) return []
  return Object.values(all).map((v) => (typeof v === "string" ? JSON.parse(v) : v))
}

export async function incrementLocationUse(alias: string): Promise<void> {
  const location = await getLearnedLocation(alias)
  if (location) {
    location.useCount++
    location.lastUsed = Date.now()
    await learnLocation(location)
  }
}

export async function deleteLearnedLocation(alias: string): Promise<void> {
  if (!isRedisAvailable()) return

  await redis!.hdel(KEYS.learnedLocations, alias.toLowerCase().trim())
}

// ========== MATCHING EVALS ==========

export async function logMatchingEval(eval_: Omit<MatchingEval, "id" | "timestamp">): Promise<string> {
  const id = `match_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  
  if (!isRedisAvailable()) {
    console.warn("Redis not available, matching eval not logged")
    return id
  }

  const fullEval: MatchingEval = {
    ...eval_,
    id,
    timestamp: Date.now(),
  }

  await redis!.zadd(KEYS.matchingEvals, {
    score: fullEval.timestamp,
    member: JSON.stringify(fullEval),
  })

  // Update stats
  await updateMatchingStats(eval_)

  return id
}

export async function getMatchingEvals(limit = 100): Promise<MatchingEval[]> {
  if (!isRedisAvailable()) return []

  const results = await redis!.zrange(KEYS.matchingEvals, -limit, -1, { rev: true })
  return results.map((r) => (typeof r === "string" ? JSON.parse(r) : r))
}

export async function updateMatchingEvalOutcome(
  evalId: string,
  successfulBooking: boolean,
  customerRating?: number,
): Promise<void> {
  if (!isRedisAvailable()) return

  const evals = await getMatchingEvals(1000)
  const evalToUpdate = evals.find((e) => e.id === evalId)

  if (evalToUpdate) {
    evalToUpdate.successfulBooking = successfulBooking
    evalToUpdate.customerRating = customerRating

    // Re-store with updated data
    await redis!.zrem(KEYS.matchingEvals, JSON.stringify({ ...evalToUpdate, successfulBooking: !successfulBooking }))
    await redis!.zadd(KEYS.matchingEvals, {
      score: evalToUpdate.timestamp,
      member: JSON.stringify(evalToUpdate),
    })

    // Update success stats
    if (successfulBooking) {
      await redis!.hincrby(KEYS.matchingStats, "successful_bookings", 1)
    }
    if (customerRating) {
      await redis!.hincrbyfloat(KEYS.matchingStats, "total_rating", customerRating)
      await redis!.hincrby(KEYS.matchingStats, "rating_count", 1)
    }
  }
}

async function updateMatchingStats(eval_: Omit<MatchingEval, "id" | "timestamp">): Promise<void> {
  if (!isRedisAvailable()) return

  await redis!.hincrby(KEYS.matchingStats, "total_matches", 1)
  await redis!.hincrby(KEYS.matchingStats, `tier_${eval_.assignedTier}`, 1)
  await redis!.hincrby(KEYS.matchingStats, "total_caterers_matched", eval_.caterersMatched)
}

export async function getMatchingStats(): Promise<Record<string, number>> {
  if (!isRedisAvailable()) return {}

  const stats = await redis!.hgetall(KEYS.matchingStats)
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(stats || {})) {
    result[key] = typeof value === "number" ? value : Number.parseFloat(value as string) || 0
  }
  return result
}

// ========== ANALYTICS ==========

export async function getSystemHealth(): Promise<{
  locationAccuracy: number
  matchingSuccessRate: number
  averageRating: number
  learnedLocationsCount: number
}> {
  const locationStats = await getLocationStats()
  const matchingStats = await getMatchingStats()
  const learnedLocations = await getAllLearnedLocations()

  const highConfidence = locationStats.confidence_high || 0
  const totalLocations = locationStats.total || 1
  const locationAccuracy = (highConfidence / totalLocations) * 100

  const successfulBookings = matchingStats.successful_bookings || 0
  const totalMatches = matchingStats.total_matches || 1
  const matchingSuccessRate = (successfulBookings / totalMatches) * 100

  const totalRating = matchingStats.total_rating || 0
  const ratingCount = matchingStats.rating_count || 1
  const averageRating = totalRating / ratingCount

  return {
    locationAccuracy: Math.round(locationAccuracy * 100) / 100,
    matchingSuccessRate: Math.round(matchingSuccessRate * 100) / 100,
    averageRating: Math.round(averageRating * 100) / 100,
    learnedLocationsCount: learnedLocations.length,
  }
}
