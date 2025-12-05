import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  label: string;
  maxImages?: number;
}

export function MultiImageUpload({ 
  values = [], 
  onChange, 
  label, 
  maxImages = 10 
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة فقط");
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 10 ميجابايت");
      return null;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;

      const { data, error } = await supabase.storage
        .from("game-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("game-images")
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - values.length;
    if (remainingSlots <= 0) {
      toast.error(`الحد الأقصى ${maxImages} صور`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(uploadFile);
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);
      
      if (successfulUploads.length > 0) {
        onChange([...values, ...successfulUploads]);
        toast.success(`تم رفع ${successfulUploads.length} صورة`);
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - values.length;
    if (remainingSlots <= 0) {
      toast.error(`الحد الأقصى ${maxImages} صور`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(uploadFile);
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);
      
      if (successfulUploads.length > 0) {
        onChange([...values, ...successfulUploads]);
        toast.success(`تم رفع ${successfulUploads.length} صورة`);
      }
    } finally {
      setIsUploading(false);
    }
  }, [values, maxImages, onChange]);

  const handleRemove = async (index: number) => {
    const urlToRemove = values[index];
    if (urlToRemove && urlToRemove.includes("game-images")) {
      try {
        const path = urlToRemove.split("/game-images/")[1];
        if (path) {
          await supabase.storage.from("game-images").remove([path]);
        }
      } catch (error) {
        console.error("Error removing image:", error);
      }
    }
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center justify-between">
        {label}
        <span className="text-xs text-muted-foreground">
          {values.length}/{maxImages}
        </span>
      </label>
      
      {/* Image Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {values.map((url, index) => (
          <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
            <img
              src={url}
              alt={`Screenshot ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {/* Upload Button */}
        {values.length < maxImages && (
          <div
            className={cn(
              "aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
              isDragging 
                ? "border-primary bg-primary/10" 
                : "border-border/50 hover:border-primary/50",
              isUploading && "pointer-events-none"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">إضافة</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}