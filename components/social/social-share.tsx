'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Share2, 
  Copy, 
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  hashtags?: string[];
}

export function SocialShare({ title, description, url, imageUrl, hashtags = [] }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareData = {
    title,
    text: description,
    url,
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedHashtags = hashtags.join(',');

  const socialLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${encodedHashtags}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const openSocialLink = (platform: keyof typeof socialLinks) => {
    window.open(socialLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share This Caterer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Social Media Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSocialLink('facebook')}
            className="flex items-center gap-2"
          >
            <Facebook className="h-4 w-4 text-blue-600" />
            Facebook
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSocialLink('twitter')}
            className="flex items-center gap-2"
          >
            <Twitter className="h-4 w-4 text-blue-400" />
            Twitter
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSocialLink('linkedin')}
            className="flex items-center gap-2"
          >
            <Linkedin className="h-4 w-4 text-blue-700" />
            LinkedIn
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSocialLink('whatsapp')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
            WhatsApp
          </Button>
        </div>

        {/* Native Share (Mobile) */}
        {navigator.share && (
          <Button
            variant="outline"
            onClick={handleNativeShare}
            className="w-full flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share via...
          </Button>
        )}

        {/* Copy Link */}
        <div className="flex gap-2">
          <Input value={url} readOnly className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Suggested hashtags:</p>
            <div className="flex flex-wrap gap-1">
              {hashtags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Social Media Links Component for Caterer Profiles
interface SocialLinksProps {
  links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  editable?: boolean;
  onUpdate?: (links: any) => void;
}

export function SocialLinks({ links, editable = false, onUpdate }: SocialLinksProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(links);

  const handleSave = () => {
    onUpdate?.(formData);
    setEditing(false);
    toast.success('Social links updated!');
  };

  const socialPlatforms = [
    { key: 'website', label: 'Website', icon: ExternalLink, color: 'text-gray-600' },
    { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { key: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-blue-400' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  ];

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialPlatforms.map((platform) => (
            <div key={platform.key}>
              <label className="text-sm font-medium">{platform.label}</label>
              <Input
                value={formData[platform.key as keyof typeof formData] || ''}
                onChange={(e) => setFormData({ ...formData, [platform.key]: e.target.value })}
                placeholder={`Your ${platform.label} URL`}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasLinks = Object.values(links).some(link => link);

  if (!hasLinks && !editable) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Connect With Us</CardTitle>
          {editable && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {socialPlatforms.map((platform) => {
            const url = links[platform.key as keyof typeof links];
            if (!url) return null;

            const Icon = platform.icon;
            return (
              <Button
                key={platform.key}
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Icon className={`h-4 w-4 ${platform.color}`} />
                  {platform.label}
                </a>
              </Button>
            );
          })}
        </div>
        
        {!hasLinks && editable && (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-2">No social links added yet</p>
            <Button variant="outline" onClick={() => setEditing(true)}>
              Add Social Links
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}