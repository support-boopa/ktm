import { useState } from "react";
import { ChevronDown, File, Download, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdditionalFile {
  name: string;
  url: string;
  size: number;
}

interface AdditionalFilesProps {
  files: AdditionalFile[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function AdditionalFiles({ files }: AdditionalFilesProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!files || files.length === 0) return null;

  return (
    <div className="border-t border-border/30 pt-4 mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 glass-card rounded-xl hover:bg-primary/5 transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div className="text-right">
            <span className="font-medium">الملفات الإضافية</span>
            <p className="text-xs text-muted-foreground">{files.length} ملفات</p>
          </div>
        </div>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      <div className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out",
        isOpen ? "max-h-[1000px] opacity-100 mt-3" : "max-h-0 opacity-0"
      )}>
        <div className="space-y-2 px-1">
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 glass-card rounded-lg group animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-secondary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              
              <a
                href={file.url}
                download={file.name}
                className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center transition-colors duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4 text-primary" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}