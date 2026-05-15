import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUploadImage } from "@workspace/api-client-react";
import { Loader2, Upload, X } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Image" }: ImageUploadProps) {
  const uploadImage = useUploadImage();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const response = await uploadImage.mutateAsync({
          data: { data: dataUrl, filename: file.name }
        });
        onChange(response.url);
      } catch {
        alert("Failed to upload image.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2 w-full">
      {label && <Label>{label}</Label>}

      {value ? (
        <div className="relative rounded-md overflow-hidden border border-border group">
          <img src={value} alt="Preview" className="w-full max-h-[200px] object-contain bg-muted" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button type="button" variant="destructive" size="icon" onClick={() => onChange("")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
          }}
        >
          <label className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer">
            {uploadImage.isPending ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : (
              <Upload className="h-7 w-7" />
            )}
            <div className="text-sm font-medium">
              <span className="text-primary hover:underline">Click to upload</span>{" "}
              or drag & drop
            </div>
            <p className="text-xs">JPG, PNG, WEBP (max 10MB)</p>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              disabled={uploadImage.isPending}
            />
          </label>
        </div>
      )}
    </div>
  );
}
