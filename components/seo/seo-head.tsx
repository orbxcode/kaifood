import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'business.business';
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  businessInfo?: {
    name: string;
    type: string;
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    priceRange?: string;
    rating?: number;
    reviewCount?: number;
  };
}

export function SEOHead({
  title = 'Kai Catering - Premium Catering Services in South Africa',
  description = 'Find the perfect caterer for your event. Browse verified caterers, compare prices, and book premium catering services across South Africa.',
  keywords = ['catering', 'south africa', 'event catering', 'wedding catering', 'corporate catering'],
  image = '/og-image.jpg',
  url,
  type = 'website',
  siteName = 'Kai Catering',
  locale = 'en_ZA',
  alternateLocales = ['af_ZA'],
  publishedTime,
  modifiedTime,
  author,
  businessInfo,
}: SEOProps) {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const keywordsString = keywords.join(', ');
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Generate structured data for business
  const businessStructuredData = businessInfo ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": businessInfo.name,
    "description": description,
    "url": canonicalUrl,
    "telephone": businessInfo.phone,
    "email": businessInfo.email,
    "priceRange": businessInfo.priceRange,
    "address": businessInfo.address ? {
      "@type": "PostalAddress",
      "streetAddress": businessInfo.address,
      "addressLocality": businessInfo.city,
      "addressRegion": businessInfo.region,
      "postalCode": businessInfo.postalCode,
      "addressCountry": businessInfo.country || "ZA"
    } : undefined,
    "aggregateRating": businessInfo.rating ? {
      "@type": "AggregateRating",
      "ratingValue": businessInfo.rating,
      "reviewCount": businessInfo.reviewCount || 1
    } : undefined,
    "image": image,
    "servesCuisine": keywords.filter(k => k.includes('cuisine') || k.includes('food')),
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": -26.2041,
        "longitude": 28.0473
      },
      "geoRadius": "50000"
    }
  } : null;

  // Generate FAQ structured data
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I book a caterer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply browse our verified caterers, request quotes, and book directly through our platform. We make it easy to find and hire the perfect caterer for your event."
        }
      },
      {
        "@type": "Question",
        "name": "What types of events do you cater?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our caterers handle all types of events including weddings, corporate events, birthday parties, conferences, and private dinners."
        }
      }
    ]
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="author" content={author || siteName} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content={locale.replace('_', '-')} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map(altLocale => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:alt" content={title} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Favicon and App Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#667eea" />
      <meta name="msapplication-TileColor" content="#667eea" />
      
      {/* Structured Data */}
      {businessStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessStructuredData)
          }}
        />
      )}
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData)
        }}
      />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Head>
  );
}

// Hook for dynamic SEO
export function useSEO() {
  const generateCatererSEO = (caterer: any) => ({
    title: `${caterer.business_name} - Professional Catering Services`,
    description: `Book ${caterer.business_name} for your next event. ${caterer.description || 'Professional catering services'} in ${caterer.city || 'South Africa'}.`,
    keywords: [
      'catering',
      caterer.city?.toLowerCase(),
      ...caterer.cuisine_types?.map((c: string) => c.toLowerCase()) || [],
      'event catering',
      'professional caterer'
    ],
    businessInfo: {
      name: caterer.business_name,
      type: 'Restaurant',
      city: caterer.city,
      region: caterer.state,
      country: 'ZA',
      rating: caterer.rating,
      reviewCount: caterer.total_reviews,
      priceRange: caterer.price_range_min && caterer.price_range_max 
        ? `R${caterer.price_range_min}-${caterer.price_range_max}`
        : undefined
    }
  });

  const generateEventSEO = (eventType: string, location?: string) => ({
    title: `${eventType} Catering Services${location ? ` in ${location}` : ''}`,
    description: `Find the best ${eventType.toLowerCase()} caterers${location ? ` in ${location}` : ''}. Compare prices, read reviews, and book professional catering services.`,
    keywords: [
      `${eventType.toLowerCase()} catering`,
      location?.toLowerCase(),
      'event catering',
      'professional caterers',
      'south africa catering'
    ].filter(Boolean)
  });

  return {
    generateCatererSEO,
    generateEventSEO
  };
}