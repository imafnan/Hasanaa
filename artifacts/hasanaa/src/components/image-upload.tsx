import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadImage } from "@workspace/api-client-react";
import { Loader2, Upload, X } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Image URL" }: ImageUploadProps) {
  const uploadImage = useUploadImage();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (file: File) => {
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        const response = await uploadImage.mutateAsync({
          data: {
            data: dataUrl,
            filename: file.name,
          }
        });
        onChange(response.url);
      } catch (error) {
        console.error("Failed to upload image", error);
        alert("Failed to upload image.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 w-full">
      <Label>{label}</Label>
      
      {value ? (
        <div className="relative rounded-md overflow-hidden border border-border group">
          <img src={value} alt="Preview" className="w-full max-h-[300px] object-contain bg-muted" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileChange(e.dataTransfer.files[0]);
            }
          }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {uploadImage.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
            <div className="text-sm font-medium">
              Drag & drop an image here, or
              <label className="text-primary hover:underline cursor-pointer ml-1">
                browse
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                  disabled={uploadImage.isPending}
                />
              </label>
            </div>
            <p className="text-xs">Supports JPG, PNG, WEBP (max 5MB)</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="h-px bg-border flex-1" />
        <span className="text-xs text-muted-foreground uppercase">OR Paste URL</span>
        <div className="h-px bg-border flex-1" />
      </div>
      
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
      />
    </div>
  );
}
