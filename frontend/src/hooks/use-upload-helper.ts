import { useUploadImage } from "@workspace/api-client-react";

export function useUploadImageHelper() {
  const uploadImage = useUploadImage();

  const uploadSingle = async (url: string | null | undefined): Promise<string | null> => {
    if (!url) return null;
    if (!url.startsWith("data:")) return url; // Already uploaded, keep original URL

    try {
      const mime = url.split(";")[0].split(":")[1] || "image/jpeg";
      const ext = mime.split("/")[1] || "jpg";
      const response = await uploadImage.mutateAsync({
        data: { data: url, filename: `image.${ext}` }
      });
      return response.url;
    } catch (err) {
      console.error("Upload failed:", err);
      throw new Error("Failed to upload image");
    }
  };

  const uploadMultiple = async (urls: string[]): Promise<string[]> => {
    if (!urls || urls.length === 0) return [];
    return Promise.all(urls.map(url => uploadSingle(url).then(res => res || "")));
  };

  return { uploadSingle, uploadMultiple, isPending: uploadImage.isPending };
}
