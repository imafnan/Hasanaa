import { useState } from "react";
import {
  useListBanners, getListBannersQueryKey, useCreateBanner, useUpdateBanner, useDeleteBanner,
  useListCategories, getListCategoriesQueryKey,
  useListSubcategories, getListSubcategoriesQueryKey,
} from "@workspace/api-client-react";
import { useUploadImageHelper } from "@/hooks/use-upload-helper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

const POSITION_OPTIONS = [
  { value: "hero", label: "Hero (Main Carousel)" },
  { value: "mid", label: "Mid-Page" },
  { value: "bottom", label: "Bottom" },
];

export default function AdminBanners() {
  const { data: banners, isLoading } = useListBanners({ query: { queryKey: getListBannersQueryKey() } });
  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const { data: allSubcategories } = useListSubcategories({}, { query: { queryKey: getListSubcategoriesQueryKey({}) } });

  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { uploadSingle } = useUploadImageHelper();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState("hero");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const filteredSubcategories = allSubcategories?.filter(s => !categoryId || s.categoryId === parseInt(categoryId)) || [];

  const resetForm = () => {
    setTitle(""); setSubtitle(""); setImageUrl(""); setLinkUrl("");
    setPosition("hero"); setCategoryId(""); setSubcategoryId("");
    setIsActive(true); setSortOrder("0"); setEditingId(null);
  };

  const handleOpenDialog = (banner?: any) => {
    if (banner) {
      setEditingId(banner.id); setTitle(banner.title); setSubtitle(banner.subtitle || "");
      setImageUrl(banner.imageUrl); setLinkUrl(banner.linkUrl || "");
      setPosition(banner.position || "hero");
      setCategoryId(banner.categoryId ? String(banner.categoryId) : "");
      setSubcategoryId(banner.subcategoryId ? String(banner.subcategoryId) : "");
      setIsActive(banner.isActive); setSortOrder(String(banner.sortOrder));
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) { toast({ title: "Title and image are required", variant: "destructive" }); return; }

    setIsUploading(true);
    let finalImageUrl = imageUrl;
    try {
      const uploadedUrl = await uploadSingle(imageUrl);
      if (uploadedUrl) finalImageUrl = uploadedUrl;
    } catch {
      toast({ title: "Failed to upload image", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const payload = {
      title, subtitle: subtitle || null, imageUrl: finalImageUrl,
      linkUrl: linkUrl || null, position,
      categoryId: categoryId && categoryId !== "none" ? parseInt(categoryId) : null,
      subcategoryId: subcategoryId && subcategoryId !== "none" ? parseInt(subcategoryId) : null,
      isActive, sortOrder: parseInt(sortOrder) || 0,
    };
    const onSuccess = () => { queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }); toast({ title: editingId ? "Banner updated" : "Banner created" }); setIsDialogOpen(false); setIsUploading(false); };
    if (editingId) {
      updateBanner.mutate({ id: editingId, data: payload }, { onSuccess, onError: () => setIsUploading(false) });
    } else {
      createBanner.mutate({ data: payload }, { onSuccess, onError: () => setIsUploading(false) });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this banner?")) {
      deleteBanner.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListBannersQueryKey() }); toast({ title: "Banner deleted" }); } });
    }
  };

  const isSubmitting = createBanner.isPending || updateBanner.isPending || isUploading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Banners</h1>
          <p className="text-muted-foreground mt-1">Manage homepage banners</p>
        </div>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" /> Add Banner</Button>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : !banners?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No banners yet.</TableCell></TableRow>
            ) : banners?.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title} className="h-12 w-20 object-cover rounded bg-muted" /> : <div className="h-12 w-20 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
                </TableCell>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell className="text-sm capitalize">{(banner as any).position || "hero"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{(banner as any).categoryId ? categories?.find(c => c.id === (banner as any).categoryId)?.name || "-" : "-"}</TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${banner.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{banner.isActive ? "Active" : "Inactive"}</span>
                </TableCell>
                <TableCell>{banner.sortOrder}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(banner)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Banner" : "Create Banner"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Subtitle</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{POSITION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Any category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories?.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory (optional)</Label>
                <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!categoryId || categoryId === "none"}>
                  <SelectTrigger><SelectValue placeholder="Any subcategory" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredSubcategories.map(sub => <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ImageUpload value={imageUrl} onChange={setImageUrl} label="Banner Image *" />
            <div className="space-y-2"><Label>Link URL (optional)</Label><Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/category/1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
              <div className="flex items-center gap-3 pt-6"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Active</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Banner"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
