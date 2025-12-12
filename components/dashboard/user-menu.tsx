'use client'

import { useState } from 'react'
import { User, Settings, CreditCard, HelpCircle, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutMenuItem } from '@/components/auth/logout-button'
import { SubscriptionStatusBadge } from '@/components/subscription/subscription-provider'

interface UserMenuProps {
  user: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    user_type: 'customer' | 'caterer' | 'admin'
    is_admin?: boolean
  }
  onNavigate?: (path: string) => void
}

export function UserMenu({ user, onNavigate }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email?.charAt(0).toUpperCase() || 'U'
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    onNavigate?.(path)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
            <AvatarFallback>
              {getInitials(user.full_name, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground capitalize">
                {user.user_type}
              </span>
              {user.is_admin && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
              {user.user_type === 'caterer' && <SubscriptionStatusBadge />}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Profile Settings */}
        <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        {/* Settings */}
        <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        {/* Caterer-specific menu items */}
        {user.user_type === 'caterer' && (
          <>
            <DropdownMenuItem onClick={() => handleNavigation('/caterer/subscription')}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Subscription</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/caterer/dashboard')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
          </>
        )}
        
        {/* Customer-specific menu items */}
        {user.user_type === 'customer' && (
          <DropdownMenuItem onClick={() => handleNavigation('/customer/dashboard')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>My Requests</span>
          </DropdownMenuItem>
        )}
        
        {/* Admin-specific menu items */}
        {user.is_admin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigation('/admin/dashboard')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/admin/users')}>
              <User className="mr-2 h-4 w-4" />
              <span>Manage Users</span>
            </DropdownMenuItem>
          </>
        )}
        
        {/* Help */}
        <DropdownMenuItem onClick={() => handleNavigation('/help')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simplified version for mobile
export function MobileUserMenu({ user, onNavigate }: UserMenuProps) {
  return (
    <div className="space-y-1">
      <div className="px-4 py-2 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
            <AvatarFallback>
              {user.full_name?.charAt(0) || user.email.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.full_name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground capitalize">
                {user.user_type}
              </span>
              {user.is_admin && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-2 py-2 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onNavigate?.('/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onNavigate?.('/settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        
        {user.user_type === 'caterer' && (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onNavigate?.('/caterer/subscription')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </Button>
        )}
        
        {user.is_admin && (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onNavigate?.('/admin/dashboard')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Admin Dashboard
          </Button>
        )}
        
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => onNavigate?.('/help')}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </Button>
        
        <div className="pt-2 border-t">
          <LogoutMenuItem />
        </div>
      </div>
    </div>
  )
}