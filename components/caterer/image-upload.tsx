'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CatererImage {
  id: string;
  image_url: string;
  image_type: string;
  alt_text: string;
  caption: string;
  is_primary: boolean;
  display_order: number;
  uploaded_at: string;
}

interface ImageUploadProps {
  catererId: string;
  images: CatererImage[];
  onImagesUpdate: (images: CatererImage[]) => void;
}

export function ImageUpload({ catererId, images, onImagesUpdate }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('gallery');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageTypes = [
    { value: 'profile', label: 'Profile Picture', description: 'Main business photo' },
    { value: 'cover', label: 'Cover Image', description: 'Banner/header image' },
    { value: 'logo', label: 'Logo', description: 'Business logo' },
    { value: 'gallery', label: 'Gallery', description: 'Portfolio images' },
    { value: 'menu_item', label: 'Menu Item', description: 'Food photos' }
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', selectedType);
      formData.append('altText', altText);
      formData.append('caption', caption);
      formData.append('isPrimary', isPrimary.toString());

      const response = await fetch(`/api/caterers/${catererId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Add new image to the list
      const updatedImages = [...images, result.image];
      onImagesUpdate(updatedImages);

      // Reset form
      setAltText('');
      setCaption('');
      setIsPrimary(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/caterers/${catererId}/images?imageId=${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      // Remove image from the list
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesUpdate(updatedImages);

      toast.success('Image deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const groupedImages = images.reduce((acc, image) => {
    if (!acc[image.image_type]) {
      acc[image.image_type] = [];
    }
    acc[image.image_type].push(image);
    return acc;
  }, {} as Record<string, CatererImage[]>);

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imageType">Image Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {imageTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="file">Select Image</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="altText">Alt Text</Label>
            <Input
              id="altText"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility"
            />
          </div>

          <div>
            <Label htmlFor="caption">Caption (Optional)</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption for this image"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isPrimary">Set as primary image for this type</Label>
          </div>

          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      <div className="space-y-6">
        {imageTypes.map((type) => {
          const typeImages = groupedImages[type.value] || [];
          if (typeImages.length === 0) return null;

          return (
            <Card key={type.value}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    {type.label}
                  </div>
                  <Badge variant="secondary">{typeImages.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image.image_url}
                          alt={image.alt_text}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Image overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteImage(image.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Primary badge */}
                      {image.is_primary && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-yellow-500 text-yellow-900">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        </div>
                      )}

                      {/* Image info */}
                      <div className="mt-2 space-y-1">
                        {image.alt_text && (
                          <p className="text-sm font-medium truncate">{image.alt_text}</p>
                        )}
                        {image.caption && (
                          <p className="text-xs text-muted-foreground truncate">{image.caption}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(image.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {images.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No images uploaded yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first image to get started with your caterer profile
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Upload First Image
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}