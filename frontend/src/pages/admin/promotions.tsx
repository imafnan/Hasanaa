import { useState } from "react";
import {
  useListPromotions, getListPromotionsQueryKey,
  useCreatePromotion, useUpdatePromotion, useDeletePromotion,
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
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { Badge } from "@/components/ui/badge";

interface PromotionItem {
  imageUrl: string;
  label: string;
  categoryId?: number | null;
  subcategoryId?: number | null;
}

const EMPTY_ITEM: PromotionItem = { imageUrl: "", label: "", categoryId: null, subcategoryId: null };

export default function AdminPromotions() {
  const { data: promotions, isLoading } = useListPromotions({ query: { queryKey: getListPromotionsQueryKey() } });
  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const { data: allSubcategories } = useListSubcategories({}, { query: { queryKey: getListSubcategoriesQueryKey({}) } });

  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { uploadSingle } = useUploadImageHelper();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [gridType, setGridType] = useState<"2" | "4">("4");
  const [position, setPosition] = useState<"top" | "bottom">("top");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [items, setItems] = useState<PromotionItem[]>([{ ...EMPTY_ITEM }, { ...EMPTY_ITEM }, { ...EMPTY_ITEM }, { ...EMPTY_ITEM }]);

  const maxItems = parseInt(gridType);

  const resetForm = () => {
    setTitle(""); setGridType("4"); setPosition("top"); setIsActive(true); setSortOrder("0");
    setItems([{ ...EMPTY_ITEM }, { ...EMPTY_ITEM }, { ...EMPTY_ITEM }, { ...EMPTY_ITEM }]); setEditingId(null);
  };

  const handleOpenDialog = (promo?: any) => {
    if (promo) {
      setEditingId(promo.id); setTitle(promo.title); setGridType(String(promo.gridType) as "2" | "4");
      setPosition(promo.position as "top" | "bottom"); setIsActive(promo.isActive); setSortOrder(String(promo.sortOrder));
      const existingItems: PromotionItem[] = promo.items || [];
      const max = promo.gridType;
      const padded = [...existingItems];
      while (padded.length < max) padded.push({ ...EMPTY_ITEM });
      setItems(padded.slice(0, max));
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const updateItem = (index: number, field: keyof PromotionItem, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleGridTypeChange = (val: "2" | "4") => {
    setGridType(val);
    const max = parseInt(val);
    setItems(prev => {
      const arr = [...prev];
      while (arr.length < max) arr.push({ ...EMPTY_ITEM });
      return arr.slice(0, max);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) { toast({ title: "Title is required", variant: "destructive" }); return; }

    setIsUploading(true);
    try {
      const uploadedItems = await Promise.all(
        items.slice(0, maxItems).map(async (item) => {
          if (item.imageUrl && item.imageUrl.startsWith("data:")) {
            const uploadedUrl = await uploadSingle(item.imageUrl);
            return { ...item, imageUrl: uploadedUrl || "" };
          }
          return item;
        })
      );
      const validItems = uploadedItems.map(item => ({
        ...item,
        categoryId: item.categoryId || null,
        subcategoryId: item.subcategoryId || null
      }));

      const payload = { title, gridType: maxItems, position, isActive, sortOrder: parseInt(sortOrder) || 0, items: validItems };
      const onSuccess = () => { queryClient.invalidateQueries({ queryKey: getListPromotionsQueryKey() }); toast({ title: editingId ? "Promotion updated" : "Promotion created" }); setIsDialogOpen(false); setIsUploading(false); };
      if (editingId) {
        updatePromotion.mutate({ id: editingId, data: payload }, { onSuccess, onError: () => setIsUploading(false) });
      } else {
        createPromotion.mutate({ data: payload }, { onSuccess, onError: () => setIsUploading(false) });
      }
    } catch {
      toast({ title: "Failed to upload promotion images", variant: "destructive" });
      setIsUploading(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this promotion block?")) {
      deletePromotion.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListPromotionsQueryKey() }); toast({ title: "Promotion deleted" }); } });
    }
  };

  const isSubmitting = createPromotion.isPending || updatePromotion.isPending || isUploading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Promotions</h1>
          <p className="text-muted-foreground mt-1">Manage promotion grid sections on the home page</p>
        </div>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" /> Add Promotion</Button>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Grid</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : !promotions?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No promotions yet.</TableCell></TableRow>
            ) : promotions?.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-medium">{promo.title}</TableCell>
                <TableCell><Badge variant="outline">{promo.gridType}-Grid</Badge></TableCell>
                <TableCell className="capitalize">{promo.position}</TableCell>
                <TableCell>{(promo.items || []).filter((i: any) => i.imageUrl).length} / {promo.gridType}</TableCell>
                <TableCell><span className={`text-xs font-medium px-2 py-1 rounded-full ${promo.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{promo.isActive ? "Active" : "Inactive"}</span></TableCell>
                <TableCell>{promo.sortOrder}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(promo)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Promotion" : "Create Promotion"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Grid Type</Label>
                <Select value={gridType} onValueChange={(v) => handleGridTypeChange(v as "2" | "4")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2-Grid (2 images)</SelectItem>
                    <SelectItem value="4">4-Grid (4 images)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={position} onValueChange={(v) => setPosition(v as "top" | "bottom")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top of page</SelectItem>
                    <SelectItem value="bottom">Bottom of page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <Label className="text-base font-semibold">Promotion Items ({maxItems} slots)</Label>
              {items.slice(0, maxItems).map((item, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Item {i + 1}</p>
                  <ImageUpload value={item.imageUrl} onChange={(url) => updateItem(i, "imageUrl", url)} label="Image" />
                  <div className="space-y-2"><Label>Label</Label><Input value={item.label} onChange={(e) => updateItem(i, "label", e.target.value)} placeholder="e.g. Thobes, Kids Wear" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Link to Category</Label>
                      <Select value={item.categoryId ? String(item.categoryId) : "none"} onValueChange={(v) => { updateItem(i, "categoryId", v === "none" ? null : parseInt(v)); updateItem(i, "subcategoryId", null); }}>
                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {categories?.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Link to Subcategory</Label>
                      <Select value={item.subcategoryId ? String(item.subcategoryId) : "none"} onValueChange={(v) => updateItem(i, "subcategoryId", v === "none" ? null : parseInt(v))} disabled={!item.categoryId}>
                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {allSubcategories?.filter(s => s.categoryId === item.categoryId).map(sub => <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <Label>Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
