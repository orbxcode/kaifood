import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChefHat,
  Sparkles,
  Calendar,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle2,
  Utensils,
  Shield,
  Heart,
} from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description:
      "Our intelligent algorithm analyzes your event needs and matches you with caterers who specialize in exactly what you're looking for.",
  },
  {
    icon: MapPin,
    title: "Local & Verified",
    description: "Find trusted caterers in your area with verified reviews, certifications, and transparent pricing.",
  },
  {
    icon: Calendar,
    title: "Seamless Booking",
    description: "From initial inquiry to final confirmation, manage your entire catering experience in one place.",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description:
      "Every caterer is vetted for food safety, insurance, and customer satisfaction before joining our platform.",
  },
]

const cuisines = [
  "Italian",
  "Mexican",
  "Asian Fusion",
  "Mediterranean",
  "BBQ",
  "Vegan",
  "French",
  "Indian",
  "American",
  "Seafood",
]

const stats = [
  { value: "500+", label: "Verified Caterers" },
  { value: "10k+", label: "Events Catered" },
  { value: "4.9", label: "Average Rating" },
  { value: "98%", label: "Satisfaction Rate" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-background to-amber-50/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-400 shadow-lg shadow-primary/25">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Kai</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link
              href="#for-caterers"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              For Caterers
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 shadow-lg shadow-primary/25"
            >
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/80 via-amber-50/50 to-rose-100/60" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-orange-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-200/40 to-rose-200/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 bg-gradient-to-r from-primary/10 to-orange-400/10 border-primary/20"
            >
              <Sparkles className="mr-1 h-3 w-3 text-primary" />
              AI-Powered Catering Marketplace
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
              Find the perfect caterer for{" "}
              <span className="bg-gradient-to-r from-primary via-orange-500 to-rose-500 bg-clip-text text-transparent">
                every occasion
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto text-pretty">
              Kai uses intelligent matching to connect you with local caterers who specialize in your cuisine, dietary
              needs, and event style. From intimate dinners to grand celebrations.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 shadow-lg shadow-primary/25"
              >
                <Link href="/auth/signup?type=customer">
                  Find a Caterer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto border-primary/30 hover:bg-primary/5 bg-transparent"
              >
                <Link href="/auth/signup?type=caterer">
                  <ChefHat className="mr-2 h-4 w-4" />
                  Join as a Caterer
                </Link>
              </Button>
            </div>

            {/* Cuisine Tags */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
              {cuisines.map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant="outline"
                  className="text-xs border-primary/20 bg-white/50 hover:bg-primary/5 transition-colors"
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-gradient-to-r from-primary/5 via-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How Kai Works</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From request to booking in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-400 text-white font-bold text-lg mx-auto shadow-lg shadow-primary/25">
                1
              </div>
              <h3 className="mt-6 text-xl font-semibold">Describe Your Event</h3>
              <p className="mt-2 text-muted-foreground">
                Tell us about your event - guest count, cuisine preferences, dietary requirements, and budget. Our AI
                understands your needs.
              </p>
            </div>

            <div className="relative text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 text-white font-bold text-lg mx-auto shadow-lg shadow-orange-400/25">
                2
              </div>
              <h3 className="mt-6 text-xl font-semibold">Get Matched</h3>
              <p className="mt-2 text-muted-foreground">
                Our AI analyzes hundreds of caterers to find your perfect matches based on specialty, location,
                availability, and reviews.
              </p>
            </div>

            <div className="relative text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 text-white font-bold text-lg mx-auto shadow-lg shadow-amber-400/25">
                3
              </div>
              <h3 className="mt-6 text-xl font-semibold">Book & Enjoy</h3>
              <p className="mt-2 text-muted-foreground">
                Compare quotes, chat with caterers, and book with confidence. Manage everything through your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gradient-to-b from-amber-50/50 to-rose-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose Kai</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              The smarter way to find and book catering services
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature, i) => (
              <Card
                key={feature.title}
                className="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 transition-all group"
              >
                <CardContent className="p-6">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${
                      i === 0
                        ? "from-primary/20 to-orange-400/20"
                        : i === 1
                          ? "from-orange-400/20 to-amber-400/20"
                          : i === 2
                            ? "from-amber-400/20 to-rose-400/20"
                            : "from-rose-400/20 to-primary/20"
                    } group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon
                      className={`h-6 w-6 ${
                        i === 0
                          ? "text-primary"
                          : i === 1
                            ? "text-orange-500"
                            : i === 2
                              ? "text-amber-500"
                              : "text-rose-500"
                      }`}
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Caterers CTA */}
      <section id="for-caterers" className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-orange-500 to-rose-500 p-8 md:p-12 lg:p-16 shadow-2xl shadow-primary/25">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />

            <div className="relative z-10 max-w-2xl">
              <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
                <Heart className="mr-1 h-3 w-3" />
                For Caterers
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Grow your catering business with Kai
              </h2>
              <p className="mt-4 text-white/90 text-lg">
                Join hundreds of caterers who use Kai to discover new clients, manage inquiries, and build their
                reputation. No upfront costs - you only pay when you book.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  "Get matched with clients looking for your specialty",
                  "Manage all inquiries and bookings in one dashboard",
                  "Build your profile with reviews and portfolio",
                  "Set your own prices and availability",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/95">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant="secondary"
                className="mt-8 bg-white text-primary hover:bg-white/90 shadow-lg"
                asChild
              >
                <Link href="/auth/signup?type=caterer">
                  Join as a Caterer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="absolute right-0 top-0 -z-0 h-full w-1/2 opacity-10">
              <Utensils className="h-full w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-rose-50/30 via-background to-orange-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by Event Planners</h2>
            <p className="mt-4 text-muted-foreground">See what our customers are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote:
                  "Kai found us an amazing caterer for our wedding in less than 24 hours. The AI matching was spot-on!",
                author: "Sarah M.",
                role: "Wedding Client",
                rating: 5,
              },
              {
                quote:
                  "As a corporate event planner, I use Kai for all my catering needs. It saves me hours of research.",
                author: "Michael T.",
                role: "Event Coordinator",
                rating: 5,
              },
              {
                quote:
                  "The dietary accommodation matching is incredible. Finally, a platform that understands food allergies.",
                author: "Emily R.",
                role: "Private Event Host",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <Card key={i} className="border-0 shadow-sm bg-white/80 backdrop-blur-sm relative overflow-hidden">
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
                    i === 0
                      ? "from-primary to-orange-400"
                      : i === 1
                        ? "from-orange-400 to-amber-400"
                        : "from-amber-400 to-rose-400"
                  }`}
                />
                <CardContent className="p-6 pt-8">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to find your perfect caterer?</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Join thousands of happy customers who found their ideal catering match with Kai.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-primary via-orange-500 to-rose-500 hover:opacity-90 shadow-lg shadow-primary/25"
            >
              <Link href="/auth/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gradient-to-r from-orange-50/50 to-amber-50/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-400 shadow-md">
                <ChefHat className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Kai</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Kai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
