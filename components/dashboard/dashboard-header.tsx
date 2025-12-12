'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/dashboard/user-menu'
import { ChefHat, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DashboardHeaderProps {
  user: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    user_type: 'customer' | 'caterer' | 'admin'
    is_admin?: boolean
  }
  title?: string
  notifications?: number
  showNotifications?: boolean
}

export function DashboardHeader({ 
  user, 
  title, 
  notifications = 0, 
  showNotifications = true 
}: DashboardHeaderProps) {
  const router = useRouter()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const getTitle = () => {
    if (title) return title
    
    switch (user.user_type) {
      case 'admin':
        return 'Admin Panel'
      case 'caterer':
        return 'Caterer Dashboard'
      case 'customer':
        return 'Customer Dashboard'
      default:
        return 'Dashboard'
    }
  }

  const getLogoColor = () => {
    switch (user.user_type) {
      case 'admin':
        return 'bg-purple-600'
      case 'caterer':
        return 'bg-gradient-to-br from-rose-500 to-orange-500'
      case 'customer':
        return 'bg-primary'
      default:
        return 'bg-primary'
    }
  }

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-lg ${getLogoColor()} flex items-center justify-center`}>
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              {user.user_type === 'admin' ? 'Kai Admin' : 'Kai'}
            </span>
          </Link>

          {/* Center Title (optional) */}
          {title && (
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            {showNotifications && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {notifications > 99 ? '99+' : notifications}
                  </Badge>
                )}
              </Button>
            )}

            {/* Navigation Links */}
            {user.user_type === 'customer' && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/customer/requests">My Requests</Link>
              </Button>
            )}

            {user.user_type === 'caterer' && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/caterer/matches">Matches</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/caterer/profile">Profile</Link>
                </Button>
              </>
            )}

            {user.is_admin && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/dashboard">Admin</Link>
              </Button>
            )}

            {/* User Menu with Logout */}
            <UserMenu user={user} onNavigate={handleNavigation} />
          </div>
        </div>
      </div>
    </header>
  )
}