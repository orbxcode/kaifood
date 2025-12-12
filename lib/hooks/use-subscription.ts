'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'

export interface SubscriptionPlan {
  id: string
  name: string
  tier: 'basic' | 'pro' | 'business'
  price_cents: number
  price_display: string
  paystack_plan_code: string | null
  max_budget_limit: number | null
  min_budget_limit: number
  features: string[]
  is_active: boolean
}

export interface CatererSubscription {
  id: string
  subscription_tier: 'basic' | 'pro' | 'business'
  subscription_status: 'inactive' | 'active' | 'cancelled' | 'past_due'
  paystack_customer_code: string | null
  paystack_subscription_code: string | null
  subscription_started_at: string | null
  subscription_expires_at: string | null
  jobs_received_this_month: number
  last_job_assigned_at: string | null
}

export function useSubscription(catererId?: string) {
  const [subscription, setSubscription] = useState<CatererSubscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch subscription plans
  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_cents', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (err) {
      console.error('Error fetching plans:', err)
      setError('Failed to load subscription plans')
    }
  }, [supabase])

  // Fetch caterer subscription
  const fetchSubscription = useCallback(async () => {
    if (!catererId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('caterers')
        .select(`
          id,
          subscription_tier,
          subscription_status,
          paystack_customer_code,
          paystack_subscription_code,
          subscription_started_at,
          subscription_expires_at,
          jobs_received_this_month,
          last_job_assigned_at
        `)
        .eq('id', catererId)
        .single()

      if (error) throw error
      setSubscription(data)
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError('Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }, [supabase, catererId])

  // Update subscription status
  const updateSubscriptionStatus = useCallback(async (
    status: CatererSubscription['subscription_status'],
    paystackData?: {
      customer_code?: string
      subscription_code?: string
      started_at?: string
      expires_at?: string
    }
  ) => {
    if (!catererId) return false

    try {
      const updateData: any = {
        subscription_status: status,
        updated_at: new Date().toISOString()
      }

      if (paystackData) {
        if (paystackData.customer_code) {
          updateData.paystack_customer_code = paystackData.customer_code
        }
        if (paystackData.subscription_code) {
          updateData.paystack_subscription_code = paystackData.subscription_code
        }
        if (paystackData.started_at) {
          updateData.subscription_started_at = paystackData.started_at
        }
        if (paystackData.expires_at) {
          updateData.subscription_expires_at = paystackData.expires_at
        }
      }

      const { error } = await supabase
        .from('caterers')
        .update(updateData)
        .eq('id', catererId)

      if (error) throw error

      // Refresh subscription data
      await fetchSubscription()
      
      toast.success('Subscription updated successfully')
      return true
    } catch (err) {
      console.error('Error updating subscription:', err)
      toast.error('Failed to update subscription')
      return false
    }
  }, [supabase, catererId, fetchSubscription])

  // Upgrade subscription tier
  const upgradeSubscription = useCallback(async (
    newTier: 'basic' | 'pro' | 'business'
  ) => {
    if (!catererId) return false

    try {
      const { error } = await supabase
        .from('caterers')
        .update({
          subscription_tier: newTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', catererId)

      if (error) throw error

      // Refresh subscription data
      await fetchSubscription()
      
      toast.success(`Upgraded to ${newTier} plan`)
      return true
    } catch (err) {
      console.error('Error upgrading subscription:', err)
      toast.error('Failed to upgrade subscription')
      return false
    }
  }, [supabase, catererId, fetchSubscription])

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!catererId) return false

    try {
      const { error } = await supabase
        .from('caterers')
        .update({
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', catererId)

      if (error) throw error

      // Refresh subscription data
      await fetchSubscription()
      
      toast.success('Subscription cancelled')
      return true
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      toast.error('Failed to cancel subscription')
      return false
    }
  }, [supabase, catererId, fetchSubscription])

  // Real-time subscription updates
  useEffect(() => {
    if (!catererId) return

    const channel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'caterers',
          filter: `id=eq.${catererId}`
        },
        (payload) => {
          console.log('Subscription updated:', payload)
          // Update local state with new data
          if (payload.new) {
            setSubscription(prev => ({
              ...prev,
              ...payload.new
            } as CatererSubscription))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, catererId])

  // Initial data fetch
  useEffect(() => {
    fetchPlans()
    if (catererId) {
      fetchSubscription()
    }
  }, [fetchPlans, fetchSubscription, catererId])

  // Helper functions
  const getCurrentPlan = useCallback(() => {
    if (!subscription) return null
    return plans.find(plan => plan.tier === subscription.subscription_tier)
  }, [subscription, plans])

  const canUpgradeTo = useCallback((tier: 'basic' | 'pro' | 'business') => {
    if (!subscription) return false
    
    const tierOrder = { basic: 1, pro: 2, business: 3 }
    return tierOrder[tier] > tierOrder[subscription.subscription_tier]
  }, [subscription])

  const isSubscriptionActive = useCallback(() => {
    return subscription?.subscription_status === 'active'
  }, [subscription])

  const daysUntilExpiry = useCallback(() => {
    if (!subscription?.subscription_expires_at) return null
    
    const expiryDate = new Date(subscription.subscription_expires_at)
    const today = new Date()
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }, [subscription])

  return {
    subscription,
    plans,
    loading,
    error,
    
    // Actions
    updateSubscriptionStatus,
    upgradeSubscription,
    cancelSubscription,
    refreshSubscription: fetchSubscription,
    
    // Helpers
    getCurrentPlan,
    canUpgradeTo,
    isSubscriptionActive,
    daysUntilExpiry
  }
}