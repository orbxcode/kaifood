'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardHeader } from './dashboard-header'
import { NotificationsTab } from './notifications-tab'
import { 
  LayoutDashboard, 
  Bell, 
  Users, 
  MessageSquare, 
  Calendar, 
  BarChart3,
  Settings,
  Star,
  TrendingUp
} from 'lucide-react'

interface DashboardLayoutProps {
  user: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    user_type: 'customer' | 'caterer' | 'admin'
    is_admin?: boolean
  }
  stats?: {
    notifications?: number
    messages?: number
    bookings?: number
    reviews?: number
  }
  children?: React.ReactNode
}

export function DashboardLayout({ user, stats, children }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Define tabs based on user type
  const getTabs = () => {
    const baseTabs = [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        content: <DashboardOverview userType={user.user_type} stats={stats} />
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        badge: stats?.notifications,
        content: <NotificationsTab />
      }
    ]

    if (user.user_type === 'admin') {
      return [
        ...baseTabs,
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          content: <div>Users management coming soon...</div>
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          content: <div>Analytics coming soon...</div>
        }
      ]
    }

    if (user.user_type === 'caterer') {
      return [
        ...baseTabs,
        {
          id: 'bookings',
          label: 'Bookings',
          icon: Calendar,
          badge: stats?.bookings,
          content: <div>Bookings management coming soon...</div>
        },
        {
          id: 'reviews',
          label: 'Reviews',
          icon: Star,
          badge: stats?.reviews,
          content: <div>Reviews management coming soon...</div>
        }
      ]
    }

    // Customer tabs
    return [
      ...baseTabs,
      {
        id: 'requests',
        label: 'My Requests',
        icon: MessageSquare,
        content: <div>Request management coming soon...</div>
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: MessageSquare,
        badge: stats?.messages,
        content: <div>Messages coming soon...</div>
      }
    ]
  }

  const tabs = getTabs()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader 
        user={user}
        notifications={stats?.notifications}
      />
      
      <div className="container mx-auto py-6 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold capitalize">{user.user_type} Dashboard</h1>
          <p className="text-muted-foreground">
            {user.user_type === 'admin' && 'Manage your platform and monitor activity'}
            {user.user_type === 'caterer' && 'Manage your catering business and bookings'}
            {user.user_type === 'customer' && 'Track your requests and manage bookings'}
          </p>
        </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>

        {/* Custom content */}
        {children}
      </div>
    </div>
  )
}

// Dashboard Overview Component
function DashboardOverview({ 
  userType, 
  stats 
}: { 
  userType: 'customer' | 'caterer' | 'admin'
  stats?: any 
}) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userType === 'admin' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Caterers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Notifications</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.notifications || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Emails to be sent
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Good</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {userType === 'caterer' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.bookings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.messages || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Unread messages
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reviews</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.reviews || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Recent reviews
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8</div>
                <p className="text-xs text-muted-foreground">
                  Average rating
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {userType === 'customer' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Pending responses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.messages || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Unread messages
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Events</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Total events
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New notification system activated</p>
                <p className="text-xs text-muted-foreground">Email notifications are now being processed automatically</p>
              </div>
              <span className="text-xs text-muted-foreground">Just now</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Dashboard updated</p>
                <p className="text-xs text-muted-foreground">New features and improvements added</p>
              </div>
              <span className="text-xs text-muted-foreground">5 min ago</span>
            </div>
            
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">System maintenance scheduled</p>
                <p className="text-xs text-muted-foreground">Brief maintenance window this weekend</p>
              </div>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}