'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Star, Eye, Archive, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  helpful_count: number
  not_helpful_count: number
  is_featured: boolean
  status: 'draft' | 'published' | 'archived'
  created_by: string | null
  created_at: string
  updated_at: string
}

const FAQ_CATEGORIES = [
  'Booking',
  'Services',
  'Payment',
  'Account',
  'Technical',
  'General'
]

const FAQ_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
  { value: 'archived', label: 'Archived', color: 'bg-red-100 text-red-800' }
]

export function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch FAQs
  const fetchFaqs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFaqs(data || [])
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      toast.error('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || faq.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || faq.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Create or update FAQ
  const saveFaq = async (faqData: Partial<FAQ>) => {
    try {
      if (editingFaq) {
        // Update existing FAQ
        const { error } = await supabase
          .from('faqs')
          .update({
            ...faqData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFaq.id)

        if (error) throw error
        toast.success('FAQ updated successfully')
      } else {
        // Create new FAQ
        const { error } = await supabase
          .from('faqs')
          .insert([{
            ...faqData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        toast.success('FAQ created successfully')
      }

      setIsDialogOpen(false)
      setEditingFaq(null)
      fetchFaqs()
    } catch (error) {
      console.error('Error saving FAQ:', error)
      toast.error('Failed to save FAQ')
    }
  }

  // Delete FAQ
  const deleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('FAQ deleted successfully')
      fetchFaqs()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      toast.error('Failed to delete FAQ')
    }
  }

  // Toggle featured status
  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ 
          is_featured: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`FAQ ${!currentStatus ? 'featured' : 'unfeatured'}`)
      fetchFaqs()
    } catch (error) {
      console.error('Error updating featured status:', error)
      toast.error('Failed to update featured status')
    }
  }

  // Update status
  const updateStatus = async (id: string, status: FAQ['status']) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success(`FAQ ${status}`)
      fetchFaqs()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const openEditDialog = (faq?: FAQ) => {
    setEditingFaq(faq || null)
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: FAQ['status']) => {
    const statusConfig = FAQ_STATUSES.find(s => s.value === status)
    return (
      <Badge className={statusConfig?.color}>
        {statusConfig?.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FAQ Management</h2>
          <p className="text-muted-foreground">
            Manage frequently asked questions and their content
          </p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faqs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {faqs.filter(f => f.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {faqs.filter(f => f.is_featured).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faqs.reduce((sum, f) => sum + f.helpful_count + f.not_helpful_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {FAQ_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {FAQ_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQs Table */}
      <Card>
        <CardHeader>
          <CardTitle>FAQs ({filteredFaqs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading FAQs...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium line-clamp-2">{faq.question}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {faq.answer}
                        </div>
                        {faq.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {faq.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {faq.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{faq.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{faq.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(faq.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-green-600">👍 {faq.helpful_count}</div>
                        <div className="text-red-600">👎 {faq.not_helpful_count}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeatured(faq.id, faq.is_featured)}
                      >
                        <Star 
                          className={`h-4 w-4 ${faq.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(faq)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Select
                          value={faq.status}
                          onValueChange={(status: FAQ['status']) => updateStatus(faq.id, status)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FAQ_STATUSES.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFaq(faq.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <FAQEditDialog
        faq={editingFaq}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingFaq(null)
        }}
        onSave={saveFaq}
      />
    </div>
  )
}

// FAQ Edit Dialog Component
function FAQEditDialog({
  faq,
  isOpen,
  onClose,
  onSave
}: {
  faq: FAQ | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<FAQ>) => void
}) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    tags: '',
    is_featured: false,
    status: 'draft' as FAQ['status']
  })

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags.join(', '),
        is_featured: faq.is_featured,
        status: faq.status
      })
    } else {
      setFormData({
        question: '',
        answer: '',
        category: 'General',
        tags: '',
        is_featured: false,
        status: 'draft'
      })
    }
  }, [faq])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const tags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    onSave({
      question: formData.question,
      answer: formData.answer,
      category: formData.category,
      tags,
      is_featured: formData.is_featured,
      status: formData.status
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{faq ? 'Edit FAQ' : 'Create New FAQ'}</DialogTitle>
          <DialogDescription>
            {faq ? 'Update the FAQ details below.' : 'Add a new frequently asked question.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Question *</Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter the question..."
              required
            />
          </div>

          <div>
            <Label htmlFor="answer">Answer *</Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              placeholder="Enter the detailed answer..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAQ_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: FAQ['status']) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAQ_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="booking, how-to, getting-started"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, is_featured: checked }))}
            />
            <Label htmlFor="featured">Featured FAQ</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {faq ? 'Update FAQ' : 'Create FAQ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}