import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Video, Link, X, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  gameSlug?: string;
}

type UploadMode = 'file' | 'youtube' | 'direct';

const VideoUpload = ({ value, onChange, gameSlug }: VideoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState<UploadMode>('file');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modes = [
    { id: 'file' as UploadMode, label: 'رفع ملف MP4', icon: Upload },
    { id: 'youtube' as UploadMode, label: 'رابط يوتيوب', icon: Video },
    { id: 'direct' as UploadMode, label: 'رابط مباشر', icon: Link },
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error('يرجى اختيار ملف فيديو');
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('حجم الملف يجب أن يكون أقل من 50 ميجابايت');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileName = gameSlug 
        ? `${gameSlug}-trailer.mp4`
        : `trailer-${Date.now()}.mp4`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('game-trailers')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      clearInterval(progressInterval);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('game-trailers')
        .getPublicUrl(data.path);

      setUploadProgress(100);
      onChange(urlData.publicUrl);
      toast.success('تم رفع الفيديو بنجاح');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('فشل رفع الفيديو: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: { files: dataTransfer.files } } as any);
    }
  };

  const clearVideo = () => {
    onChange('');
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-white">تريلر اللعبة</Label>
        
        {/* Custom Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-all"
          >
            {modes.find(m => m.id === mode)?.icon && (
              <span className="w-4 h-4">
                {(() => {
                  const Icon = modes.find(m => m.id === mode)?.icon;
                  return Icon ? <Icon className="w-4 h-4" /> : null;
                })()}
              </span>
            )}
            {modes.find(m => m.id === mode)?.label}
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    mode === m.id 
                      ? 'bg-primary/20 text-primary' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Video Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border border-white/20">
          {isYouTubeUrl(value) ? (
            <div className="aspect-video bg-black/50 flex items-center justify-center">
              <Video className="w-12 h-12 text-white/50" />
              <span className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                YouTube: {value}
              </span>
            </div>
          ) : (
            <video 
              src={value} 
              className="w-full aspect-video object-cover"
              controls
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearVideo}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Upload Mode: File */}
      {mode === 'file' && !value && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
              <p className="text-white">جاري الرفع... {uploadProgress}%</p>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-white/50 mb-3" />
              <p className="text-white mb-1">اسحب وأفلت ملف الفيديو هنا</p>
              <p className="text-white/50 text-sm">أو اضغط للاختيار</p>
              <p className="text-white/30 text-xs mt-2">الحد الأقصى: 50 ميجابايت | MP4, WebM, OGG</p>
            </>
          )}
        </div>
      )}

      {/* Upload Mode: YouTube URL */}
      {mode === 'youtube' && !value && (
        <div className="space-y-2">
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            className="bg-white/10 border-white/20 text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (input.value) {
                  onChange(input.value);
                  toast.success('تم إضافة رابط YouTube');
                }
              }
            }}
            onBlur={(e) => {
              if (e.target.value) {
                onChange(e.target.value);
              }
            }}
          />
          <p className="text-white/50 text-xs">الصق رابط فيديو YouTube واضغط Enter</p>
        </div>
      )}

      {/* Upload Mode: Direct URL */}
      {mode === 'direct' && !value && (
        <div className="space-y-2">
          <Input
            placeholder="https://example.com/trailer.mp4"
            className="bg-white/10 border-white/20 text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (input.value) {
                  onChange(input.value);
                  toast.success('تم إضافة رابط الفيديو');
                }
              }
            }}
            onBlur={(e) => {
              if (e.target.value) {
                onChange(e.target.value);
              }
            }}
          />
          <p className="text-white/50 text-xs">الصق رابط الفيديو المباشر (MP4) واضغط Enter</p>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
