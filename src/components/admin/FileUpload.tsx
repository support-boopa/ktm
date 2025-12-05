import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, File, Loader2, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AdditionalFile {
  name: string;
  url: string;
  size: number; // in bytes
}

interface FileUploadProps {
  values: AdditionalFile[];
  onChange: (files: AdditionalFile[]) => void;
  label: string;
  maxFiles?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileUpload({ 
  values = [], 
  onChange, 
  label, 
  maxFiles = 10 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<AdditionalFile | null> => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 100 ميجابايت");
      return null;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `additional-files/${fileName}`;

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

      return {
        name: file.name,
        url: publicUrl,
        size: file.size,
      };
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - values.length;
    if (remainingSlots <= 0) {
      toast.error(`الحد الأقصى ${maxFiles} ملفات`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(uploadFile);
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((file): file is AdditionalFile => file !== null);
      
      if (successfulUploads.length > 0) {
        onChange([...values, ...successfulUploads]);
        toast.success(`تم رفع ${successfulUploads.length} ملف`);
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = async (index: number) => {
    const fileToRemove = values[index];
    if (fileToRemove && fileToRemove.url.includes("game-images")) {
      try {
        const path = fileToRemove.url.split("/game-images/")[1];
        if (path) {
          await supabase.storage.from("game-images").remove([path]);
        }
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center justify-between">
        {label}
        <span className="text-xs text-muted-foreground">
          {values.length}/{maxFiles}
        </span>
      </label>
      
      {/* Files List */}
      <div className="space-y-2">
        {values.map((file, index) => (
          <div 
            key={index} 
            className="flex items-center gap-3 p-3 glass-card rounded-lg group"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <File className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="w-8 h-8 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {/* Upload Button */}
        {values.length < maxFiles && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "w-full p-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-all duration-300",
              "border-border/50 hover:border-primary/50 hover:bg-primary/5",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">جاري الرفع...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">إضافة ملف</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}