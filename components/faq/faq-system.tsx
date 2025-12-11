'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  HelpCircle, 
  ChevronDown,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpful_count: number;
  not_helpful_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQSystemProps {
  faqs: FAQ[];
  categories: string[];
  isAdmin?: boolean;
  onUpdate?: () => void;
}

export function FAQSystem({ faqs, categories, isAdmin = false, onUpdate }: FAQSystemProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>(faqs);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter FAQs based on search and category
  useEffect(() => {
    let filtered = faqs;

    if (searchTerm) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Sort by featured first, then by helpful count
    filtered.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return b.helpful_count - a.helpful_count;
    });

    setFilteredFAQs(filtered);
  }, [faqs, searchTerm, selectedCategory]);

  const handleVote = async (faqId: string, isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/faq/${faqId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful: isHelpful }),
      });

      if (response.ok) {
        toast.success('Thank you for your feedback!');
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Featured FAQs */}
      {filteredFAQs.some(faq => faq.is_featured) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Featured Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs
                .filter(faq => faq.is_featured)
                .map((faq) => (
                  <FAQItem
                    key={faq.id}
                    faq={faq}
                    isAdmin={isAdmin}
                    onVote={handleVote}
                    onUpdate={onUpdate}
                  />
                ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* All FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>All Questions ({filteredFAQs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No FAQs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'No FAQs have been added yet'}
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs
                .filter(faq => !faq.is_featured)
                .map((faq) => (
                  <FAQItem
                    key={faq.id}
                    faq={faq}
                    isAdmin={isAdmin}
                    onVote={handleVote}
                    onUpdate={onUpdate}
                  />
                ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Add FAQ Form */}
      {showAddForm && (
        <AddFAQForm
          categories={categories}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
}

// Individual FAQ Item Component
function FAQItem({ 
  faq, 
  isAdmin, 
  onVote, 
  onUpdate 
}: { 
  faq: FAQ; 
  isAdmin: boolean; 
  onVote: (id: string, helpful: boolean) => void;
  onUpdate?: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`/api/faq/${faq.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('FAQ deleted successfully');
        onUpdate?.();
      }
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  return (
    <AccordionItem value={faq.id}>
      <AccordionTrigger className="text-left">
        <div className="flex items-center justify-between w-full pr-4">
          <span className="font-medium">{faq.question}</span>
          <div className="flex items-center gap-2">
            {faq.is_featured && (
              <Star className="h-4 w-4 text-yellow-500" />
            )}
            <Badge variant="outline">{faq.category}</Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p>{faq.answer}</p>
          </div>

          {/* Tags */}
          {faq.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {faq.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Was this helpful?</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onVote(faq.id, true)}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp className="h-3 w-3" />
                  {faq.helpful_count}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onVote(faq.id, false)}
                  className="flex items-center gap-1"
                >
                  <ThumbsDown className="h-3 w-3" />
                  {faq.not_helpful_count}
                </Button>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// Add FAQ Form Component
function AddFAQForm({ 
  categories, 
  onClose, 
  onSuccess 
}: { 
  categories: string[]; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: categories[0] || '',
    tags: '',
    is_featured: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        toast.success('FAQ added successfully');
        onSuccess();
      } else {
        throw new Error('Failed to add FAQ');
      }
    } catch (error) {
      toast.error('Failed to add FAQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New FAQ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Question</label>
            <Input
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Enter the question"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Answer</label>
            <Textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="Enter the answer"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="catering, pricing, booking"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="featured"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
            />
            <label htmlFor="featured" className="text-sm font-medium">
              Feature this FAQ
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add FAQ'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}