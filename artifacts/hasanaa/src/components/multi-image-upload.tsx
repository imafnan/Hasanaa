import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { useUploadImage } from "@workspace/api-client-react";
import { Loader2, Upload, X } from "lucide-react";

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxImages?: number;
}

export function MultiImageUpload({ values, onChange, label = "Images", maxImages = 10 }: MultiImageUploadProps) {
  const uploadImage = useUploadImage();
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is too large. Maximum size is 5MB.`);
      return null;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
          const response = await uploadImage.mutateAsync({ data: { data: dataUrl, filename: file.name } });
          resolve(response.url);
        } catch {
          alert(`Failed to upload ${file.name}.`);
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const available = maxImages - values.length;
    if (available <= 0) return;
    const toUpload = fileArr.slice(0, available);
    setUploading(true);
    const urls: string[] = [];
    for (const file of toUpload) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    onChange([...values, ...urls]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2 w-full">
      {label && <Label>{label}</Label>}

      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((url, i) => (
            <div key={i} className="relative group w-20 h-24 bg-muted rounded-lg overflow-hidden border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              >
                <X className="h-5 w-5" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-white bg-black/60 py-0.5">Cover</span>
              )}
            </div>
          ))}
        </div>
      )}

      {values.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground pointer-events-none">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <p className="text-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs">Multiple files allowed · JPG, PNG, WEBP (max 5MB each)</p>
            {values.length > 0 && <p className="text-xs">{values.length}/{maxImages} images added</p>}
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}
