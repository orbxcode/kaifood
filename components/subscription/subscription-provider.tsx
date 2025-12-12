'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useSubscription, type CatererSubscription, type SubscriptionPlan } from '@/lib/hooks/use-subscription'

interface SubscriptionContextType {
  subscription: CatererSubscription | null
  plans: SubscriptionPlan[]
  loading: boolean
  error: string | null
  
  // Actions
  updateSubscriptionStatus: (
    status: CatererSubscription['subscription_status'],
    paystackData?: {
      customer_code?: string
      subscription_code?: string
      started_at?: string
      expires_at?: string
    }
  ) => Promise<boolean>
  upgradeSubscription: (tier: 'basic' | 'pro' | 'business') => Promise<boolean>
  cancelSubscription: () => Promise<boolean>
  refreshSubscription: () => Promise<void>
  
  // Helpers
  getCurrentPlan: () => SubscriptionPlan | null
  canUpgradeTo: (tier: 'basic' | 'pro' | 'business') => boolean
  isSubscriptionActive: () => boolean
  daysUntilExpiry: () => number | null
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

interface SubscriptionProviderProps {
  children: React.ReactNode
  catererId?: string
}

export function SubscriptionProvider({ children, catererId }: SubscriptionProviderProps) {
  const subscriptionHook = useSubscription(catererId)
  
  return (
    <SubscriptionContext.Provider value={subscriptionHook}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider')
  }
  return context
}

// Paystack integration component
export function PaystackSubscriptionHandler({ 
  catererId, 
  onSuccess, 
  onError 
}: {
  catererId: string
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}) {
  const { updateSubscriptionStatus } = useSubscriptionContext()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Listen for Paystack webhook events
    const handlePaystackWebhook = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const { type, data } = event.data

      if (type === 'paystack_subscription_success') {
        try {
          // Update subscription status
          const success = await updateSubscriptionStatus('active', {
            customer_code: data.customer_code,
            subscription_code: data.subscription_code,
            started_at: data.created_at,
            expires_at: data.next_payment_date
          })

          if (success) {
            // Log transaction
            await supabase.from('subscription_transactions').insert({
              caterer_id: catererId,
              paystack_reference: data.reference,
              paystack_transaction_id: data.id,
              amount_cents: data.amount,
              status: 'success',
              event_type: 'subscription.create',
              metadata: data
            })

            onSuccess?.(data)
          }
        } catch (error) {
          console.error('Error handling Paystack success:', error)
          onError?.(error)
        }
      }

      if (type === 'paystack_subscription_failed') {
        try {
          // Log failed transaction
          await supabase.from('subscription_transactions').insert({
            caterer_id: catererId,
            paystack_reference: data.reference,
            amount_cents: data.amount || 0,
            status: 'failed',
            event_type: 'subscription.failed',
            metadata: data
          })

          onError?.(data)
        } catch (error) {
          console.error('Error handling Paystack failure:', error)
        }
      }
    }

    window.addEventListener('message', handlePaystackWebhook)
    return () => window.removeEventListener('message', handlePaystackWebhook)
  }, [catererId, updateSubscriptionStatus, onSuccess, onError, supabase])

  return null
}

// Subscription status badge component
export function SubscriptionStatusBadge() {
  const { subscription, isSubscriptionActive, daysUntilExpiry } = useSubscriptionContext()

  if (!subscription) return null

  const days = daysUntilExpiry()
  const isActive = isSubscriptionActive()

  const getStatusColor = () => {
    if (!isActive) return 'bg-red-100 text-red-800'
    if (days && days <= 7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusText = () => {
    if (!isActive) return 'Inactive'
    if (days && days <= 0) return 'Expired'
    if (days && days <= 7) return `Expires in ${days} days`
    return 'Active'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {getStatusText()}
    </span>
  )
}

// Subscription upgrade prompt
export function SubscriptionUpgradePrompt() {
  const { subscription, plans, canUpgradeTo } = useSubscriptionContext()

  if (!subscription || subscription.subscription_tier === 'business') return null

  const nextTier = subscription.subscription_tier === 'basic' ? 'pro' : 'business'
  const nextPlan = plans.find(plan => plan.tier === nextTier)

  if (!nextPlan || !canUpgradeTo(nextTier)) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900">
            Upgrade to {nextPlan.name}
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Get more features for {nextPlan.price_display}/month
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
          Upgrade Now
        </button>
      </div>
    </div>
  )
}