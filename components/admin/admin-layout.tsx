'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { UserMenu } from '@/components/dashboard/user-menu'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  HelpCircle,
  Settings,
  BarChart3,
  Shield,
  Menu,
  Home
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    user_type: 'customer' | 'caterer' | 'admin'
    is_admin?: boolean
  }
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: MessageSquare
  },
  {
    title: 'FAQs',
    href: '/admin/faqs',
    icon: HelpCircle
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings
  }
]

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Shield className="h-6 w-6 text-purple-600" />
        <span className="font-semibold text-lg">Admin Panel</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {/* Back to Main Site */}
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start mb-4">
            <Home className="h-4 w-4 mr-2" />
            Back to Site
          </Button>
        </Link>

        {/* Admin Navigation */}
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-purple-100 text-purple-900 hover:bg-purple-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.title}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="px-4 py-4 border-t">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.full_name || 'Admin User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r">
          <NavContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Breadcrumb or Title */}
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {adminNavItems.find(item => item.href === pathname)?.title || 'Admin Panel'}
            </h1>
          </div>

          {/* User Menu */}
          <UserMenu user={user} />
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// HOC to wrap admin pages
export function withAdminLayout<T extends object>(
  Component: React.ComponentType<T>
) {
  return function AdminLayoutWrapper(props: T & { user: AdminLayoutProps['user'] }) {
    const { user, ...componentProps } = props
    
    return (
      <AdminLayout user={user}>
        <Component {...(componentProps as T)} />
      </AdminLayout>
    )
  }
}