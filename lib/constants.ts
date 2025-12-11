// Kai Platform Constants

// ============ South African Cities ============
export const SA_CITIES = [
  {
    city: "Johannesburg",
    province: "Gauteng",
    lat: -26.2041,
    lng: 28.0473,
    aliases: ["jozi", "joburg", "jhb", "egoli"],
  },
  { city: "Cape Town", province: "Western Cape", lat: -33.9249, lng: 18.4241, aliases: ["cpt", "ct", "kaapstad"] },
  { city: "Durban", province: "KwaZulu-Natal", lat: -29.8587, lng: 31.0218, aliases: ["durbs", "dbn", "ethekwini"] },
  { city: "Pretoria", province: "Gauteng", lat: -25.7479, lng: 28.2293, aliases: ["pta", "tshwane"] },
  {
    city: "Gqeberha",
    province: "Eastern Cape",
    lat: -33.9608,
    lng: 25.6022,
    aliases: ["pe", "p.e.", "port elizabeth"],
  },
  { city: "Bloemfontein", province: "Free State", lat: -29.0852, lng: 26.1596, aliases: ["bloem", "bfn"] },
  { city: "East London", province: "Eastern Cape", lat: -33.0292, lng: 27.8546, aliases: ["el"] },
  { city: "Polokwane", province: "Limpopo", lat: -23.9045, lng: 29.4689, aliases: ["pietersburg"] },
  { city: "Mbombela", province: "Mpumalanga", lat: -25.4753, lng: 30.9694, aliases: ["nelspruit"] },
  { city: "Kimberley", province: "Northern Cape", lat: -28.7282, lng: 24.7499, aliases: [] },
  { city: "Stellenbosch", province: "Western Cape", lat: -33.9321, lng: 18.8602, aliases: ["stellies"] },
  { city: "Sandton", province: "Gauteng", lat: -26.1076, lng: 28.0567, aliases: [] },
  { city: "Centurion", province: "Gauteng", lat: -25.8603, lng: 28.1894, aliases: [] },
  { city: "Midrand", province: "Gauteng", lat: -25.9891, lng: 28.1024, aliases: [] },
  { city: "Soweto", province: "Gauteng", lat: -26.2485, lng: 27.854, aliases: [] },
  { city: "Paarl", province: "Western Cape", lat: -33.7342, lng: 18.9622, aliases: [] },
  { city: "Franschhoek", province: "Western Cape", lat: -33.9133, lng: 19.1169, aliases: [] },
  { city: "George", province: "Western Cape", lat: -33.963, lng: 22.4617, aliases: [] },
  { city: "Knysna", province: "Western Cape", lat: -34.0356, lng: 23.0488, aliases: [] },
  { city: "Pietermaritzburg", province: "KwaZulu-Natal", lat: -29.6006, lng: 30.3794, aliases: ["pmb"] },
  { city: "Richards Bay", province: "KwaZulu-Natal", lat: -28.783, lng: 32.0377, aliases: [] },
  { city: "Umhlanga", province: "KwaZulu-Natal", lat: -29.7257, lng: 31.0848, aliases: [] },
  { city: "Ballito", province: "KwaZulu-Natal", lat: -29.5389, lng: 31.214, aliases: [] },
  { city: "Rustenburg", province: "North West", lat: -25.6715, lng: 27.242, aliases: [] },
  { city: "Potchefstroom", province: "North West", lat: -26.7145, lng: 27.0937, aliases: ["potch"] },
] as const

export type SACity = (typeof SA_CITIES)[number]

// ============ Subscription Tiers ============
export const SUBSCRIPTION_TIERS = {
  basic: {
    name: "Basic",
    price: 24900,
    priceDisplay: "R249",
    maxBudget: 20000,
    minBudget: 0,
    leadsPerMonth: 5,
    features: ["Events up to R20,000", "5 leads per month", "Basic analytics", "Email support"],
  },
  pro: {
    name: "Pro",
    price: 49900,
    priceDisplay: "R499",
    maxBudget: 50000,
    minBudget: 20000,
    leadsPerMonth: 15,
    features: [
      "Events R20,000 - R50,000",
      "15 leads per month",
      "Advanced analytics",
      "Priority support",
      "Featured listing",
    ],
  },
  business: {
    name: "Business",
    price: 99900,
    priceDisplay: "R999",
    maxBudget: null,
    minBudget: 50000,
    leadsPerMonth: null,
    features: [
      "Premium events R50,000+",
      "Unlimited leads",
      "Full analytics suite",
      "Dedicated support",
      "Top placement",
      "Custom branding",
    ],
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

// ============ Budget Tier Routing ============
export function getTierForBudget(totalBudget: number): SubscriptionTier {
  if (totalBudget >= 50000) return "business"
  if (totalBudget >= 20000) return "pro"
  return "basic"
}

// ============ South African Location Aliases ============
export const LOCATION_ALIASES: Record<string, { city: string; province: string; lat: number; lng: number }> = {
  cpt: { city: "Cape Town", province: "Western Cape", lat: -33.9249, lng: 18.4241 },
  "cape town": { city: "Cape Town", province: "Western Cape", lat: -33.9249, lng: 18.4241 },
  ct: { city: "Cape Town", province: "Western Cape", lat: -33.9249, lng: 18.4241 },
  kaapstad: { city: "Cape Town", province: "Western Cape", lat: -33.9249, lng: 18.4241 },
  jozi: { city: "Johannesburg", province: "Gauteng", lat: -26.2041, lng: 28.0473 },
  joburg: { city: "Johannesburg", province: "Gauteng", lat: -26.2041, lng: 28.0473 },
  jhb: { city: "Johannesburg", province: "Gauteng", lat: -26.2041, lng: 28.0473 },
  johannesburg: { city: "Johannesburg", province: "Gauteng", lat: -26.2041, lng: 28.0473 },
  egoli: { city: "Johannesburg", province: "Gauteng", lat: -26.2041, lng: 28.0473 },
  pta: { city: "Pretoria", province: "Gauteng", lat: -25.7479, lng: 28.2293 },
  pretoria: { city: "Pretoria", province: "Gauteng", lat: -25.7479, lng: 28.2293 },
  tshwane: { city: "Pretoria", province: "Gauteng", lat: -25.7479, lng: 28.2293 },
  durbs: { city: "Durban", province: "KwaZulu-Natal", lat: -29.8587, lng: 31.0218 },
  durban: { city: "Durban", province: "KwaZulu-Natal", lat: -29.8587, lng: 31.0218 },
  dbn: { city: "Durban", province: "KwaZulu-Natal", lat: -29.8587, lng: 31.0218 },
  ethekwini: { city: "Durban", province: "KwaZulu-Natal", lat: -29.8587, lng: 31.0218 },
  pe: { city: "Gqeberha", province: "Eastern Cape", lat: -33.9608, lng: 25.6022 },
  "p.e.": { city: "Gqeberha", province: "Eastern Cape", lat: -33.9608, lng: 25.6022 },
  "port elizabeth": { city: "Gqeberha", province: "Eastern Cape", lat: -33.9608, lng: 25.6022 },
  gqeberha: { city: "Gqeberha", province: "Eastern Cape", lat: -33.9608, lng: 25.6022 },
  bloem: { city: "Bloemfontein", province: "Free State", lat: -29.0852, lng: 26.1596 },
  bloemfontein: { city: "Bloemfontein", province: "Free State", lat: -29.0852, lng: 26.1596 },
  bfn: { city: "Bloemfontein", province: "Free State", lat: -29.0852, lng: 26.1596 },
  el: { city: "East London", province: "Eastern Cape", lat: -33.0292, lng: 27.8546 },
  "east london": { city: "East London", province: "Eastern Cape", lat: -33.0292, lng: 27.8546 },
  polokwane: { city: "Polokwane", province: "Limpopo", lat: -23.9045, lng: 29.4689 },
  pietersburg: { city: "Polokwane", province: "Limpopo", lat: -23.9045, lng: 29.4689 },
  nelspruit: { city: "Mbombela", province: "Mpumalanga", lat: -25.4753, lng: 30.9694 },
  mbombela: { city: "Mbombela", province: "Mpumalanga", lat: -25.4753, lng: 30.9694 },
  kimberley: { city: "Kimberley", province: "Northern Cape", lat: -28.7282, lng: 24.7499 },
  stellies: { city: "Stellenbosch", province: "Western Cape", lat: -33.9321, lng: 18.8602 },
  stellenbosch: { city: "Stellenbosch", province: "Western Cape", lat: -33.9321, lng: 18.8602 },
  paarl: { city: "Paarl", province: "Western Cape", lat: -33.7342, lng: 18.9622 },
  franschhoek: { city: "Franschhoek", province: "Western Cape", lat: -33.9133, lng: 19.1169 },
  sandton: { city: "Sandton", province: "Gauteng", lat: -26.1076, lng: 28.0567 },
  midrand: { city: "Midrand", province: "Gauteng", lat: -25.9891, lng: 28.1024 },
  centurion: { city: "Centurion", province: "Gauteng", lat: -25.8603, lng: 28.1894 },
  soweto: { city: "Soweto", province: "Gauteng", lat: -26.2485, lng: 27.854 },
  pmb: { city: "Pietermaritzburg", province: "KwaZulu-Natal", lat: -29.6006, lng: 30.3794 },
  pietermaritzburg: { city: "Pietermaritzburg", province: "KwaZulu-Natal", lat: -29.6006, lng: 30.3794 },
  potch: { city: "Potchefstroom", province: "North West", lat: -26.7145, lng: 27.0937 },
  potchefstroom: { city: "Potchefstroom", province: "North West", lat: -26.7145, lng: 27.0937 },
} as const

// Function to get city data by name or alias
export function getCityData(input: string): SACity | null {
  const normalized = input.toLowerCase().trim()
  return SA_CITIES.find((c) => c.city.toLowerCase() === normalized || c.aliases?.some((a) => a === normalized)) || null
}

// Function to normalize location input
export function normalizeLocation(input: string): { city: string; province: string; lat: number; lng: number } | null {
  const normalized = input.toLowerCase().trim()
  return LOCATION_ALIASES[normalized] || null
}
