'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CatererImage {
  id: string;
  image_url: string;
  image_type: string;
  alt_text: string;
  caption: string;
  is_primary: boolean;
  display_order: number;
  uploaded_at: string;
  file_size?: number;
  file_type?: string;
  width?: number;
  height?: number;
}

export function useCatererImages(catererId: string) {
  const [images, setImages] = useState<CatererImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('caterer_images')
        .select('*')
        .eq('caterer_id', catererId)
        .order('display_order', { ascending: true })
        .order('uploaded_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setImages(data || []);
    } catch (err) {
      console.error('Error fetching caterer images:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const getImagesByType = (type: string) => {
    return images.filter(img => img.image_type === type);
  };

  const getPrimaryImage = (type: string) => {
    return images.find(img => img.image_type === type && img.is_primary);
  };

  const getProfilePicture = () => {
    return getPrimaryImage('profile')?.image_url;
  };

  const getCoverImage = () => {
    return getPrimaryImage('cover')?.image_url;
  };

  const getLogo = () => {
    return getPrimaryImage('logo')?.image_url;
  };

  const getGalleryImages = () => {
    return getImagesByType('gallery');
  };

  const refreshImages = () => {
    fetchImages();
  };

  useEffect(() => {
    if (catererId) {
      fetchImages();
    }
  }, [catererId]);

  // Set up real-time subscription for image changes
  useEffect(() => {
    if (!catererId) return;

    const channel = supabase
      .channel(`caterer-images-${catererId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'caterer_images',
          filter: `caterer_id=eq.${catererId}`,
        },
        (payload) => {
          console.log('Image change detected:', payload);
          fetchImages(); // Refresh images when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [catererId]);

  return {
    images,
    loading,
    error,
    getImagesByType,
    getPrimaryImage,
    getProfilePicture,
    getCoverImage,
    getLogo,
    getGalleryImages,
    refreshImages,
    setImages, // For manual updates after upload/delete
  };
}

// Hook for uploading images
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async (
    catererId: string,
    file: File,
    options: {
      imageType: string;
      altText?: string;
      caption?: string;
      isPrimary?: boolean;
    }
  ) => {
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', options.imageType);
      formData.append('altText', options.altText || '');
      formData.append('caption', options.caption || '');
      formData.append('isPrimary', (options.isPrimary || false).toString());

      const response = await fetch(`/api/caterers/${catererId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      return result.image;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (catererId: string, imageId: string) => {
    try {
      const response = await fetch(`/api/caterers/${catererId}/images?imageId=${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };

  return {
    uploading,
    uploadError,
    uploadImage,
    deleteImage,
  };
}