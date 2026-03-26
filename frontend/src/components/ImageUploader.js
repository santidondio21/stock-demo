import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const ImageUploader = ({ value, onChange, label = "Imagen del Producto" }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Cloudinary devuelve una URL completa, NO agregar BACKEND_URL
      const imageUrl = response.data.image_url;
      setPreviewUrl(imageUrl);
      onChange(imageUrl);
      toast.success('Imagen cargada exitosamente');
    } catch (error) {
      toast.error('Error al cargar la imagen');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {previewUrl ? (
        <div className="relative">
          <div className="aspect-square w-full max-w-xs overflow-hidden rounded-lg border-2 border-stone-200">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1760621393386-3906922b0b78?w=400';
              }}
            />
          </div>
          <Button
            type="button"
            onClick={handleRemoveImage}
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full"
            data-testid="remove-image-button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery" data-testid="gallery-tab">
              <ImageIcon className="h-4 w-4 mr-2" />
              Galería
            </TabsTrigger>
            <TabsTrigger value="camera" data-testid="camera-tab">
              <Camera className="h-4 w-4 mr-2" />
              Cámara
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gallery" className="space-y-3">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-lg p-8 hover:border-primary/50 transition-colors">
              <ImageIcon className="h-12 w-12 text-stone-400 mb-3" />
              <p className="text-sm text-stone-600 mb-4 text-center">
                Selecciona una imagen de tu galería
              </p>
              <Button
                type="button"
                onClick={handleGalleryClick}
                disabled={uploading}
                className="rounded-full font-bold"
                style={{ backgroundColor: '#A8D5BA', color: '#1A1A1A' }}
                data-testid="select-gallery-button"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Subiendo...' : 'Seleccionar de Galería'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="camera" className="space-y-3">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-lg p-8 hover:border-primary/50 transition-colors">
              <Camera className="h-12 w-12 text-stone-400 mb-3" />
              <p className="text-sm text-stone-600 mb-4 text-center">
                Toma una foto con tu cámara
              </p>
              <Button
                type="button"
                onClick={handleCameraClick}
                disabled={uploading}
                className="rounded-full font-bold"
                style={{ backgroundColor: '#FFB380', color: '#1A1A1A' }}
                data-testid="take-photo-button"
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? 'Subiendo...' : 'Tomar Foto'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        data-testid="gallery-input"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        data-testid="camera-input"
      />
    </div>
  );
};

export default ImageUploader;
