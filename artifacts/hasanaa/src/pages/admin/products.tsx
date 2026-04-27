import { useState } from "react";
import {
  useListProducts, getListProductsQueryKey,
  useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListCategories, getListCategoriesQueryKey,
  useListSubcategories, getListSubcategoriesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, X } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { Badge } from "@/components/ui/badge";

export default function AdminProducts() {
  const { data: products, isLoading } = useListProducts({}, { query: { queryKey: getListProductsQueryKey({}) } });
  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const { data: allSubcategories } = useListSubcategories({}, { query: { queryKey: getListSubcategoriesQueryKey({}) } });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [inStock, setInStock] = useState(true);
  const [sizesStr, setSizesStr] = useState("");
  const [colorsStr, setColorsStr] = useState("");
  const [extraImageUrl, setExtraImageUrl] = useState("");

  const filteredSubcategories = allSubcategories?.filter(s => !categoryId || s.categoryId === parseInt(categoryId)) || [];

  const resetForm = () => {
    setName(""); setDescription(""); setPrice(""); setOriginalPrice("");
    setImageUrl(""); setImages([]); setCategoryId(""); setSubcategoryId("");
    setInStock(true); setSizesStr(""); setColorsStr(""); setExtraImageUrl(""); setEditingId(null);
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingId(product.id); setName(product.name); setDescription(product.description || "");
      setPrice(product.price); setOriginalPrice(product.originalPrice || "");
      setImageUrl(product.imageUrl || ""); setImages(product.images || []);
      setCategoryId(product.categoryId ? String(product.categoryId) : "");
      setSubcategoryId(product.subcategoryId ? String(product.subcategoryId) : "");
      setInStock(product.inStock);
      setSizesStr((product.sizes || []).join(", ")); setColorsStr((product.colors || []).join(", "));
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) { toast({ title: "Name and price are required", variant: "destructive" }); return; }
    const payload = {
      name, description: description || null, price,
      originalPrice: originalPrice || null, imageUrl: imageUrl || null, images,
      categoryId: categoryId && categoryId !== "none" ? parseInt(categoryId) : null,
      subcategoryId: subcategoryId && subcategoryId !== "none" ? parseInt(subcategoryId) : null,
      inStock,
      sizes: sizesStr.split(",").map(s => s.trim()).filter(Boolean),
      colors: colorsStr.split(",").map(c => c.trim()).filter(Boolean),
    };
    const onSuccess = () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({}) }); toast({ title: editingId ? "Product updated" : "Product created" }); setIsDialogOpen(false); };
    if (editingId) {
      updateProduct.mutate({ id: editingId, data: payload }, { onSuccess });
    } else {
      createProduct.mutate({ data: payload }, { onSuccess });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this product?")) {
      deleteProduct.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({}) }); toast({ title: "Product deleted" }); } });
    }
  };

  const addExtraImage = () => {
    if (extraImageUrl && !images.includes(extraImageUrl)) { setImages([...images, extraImageUrl]); setExtraImageUrl(""); }
  };

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory</p>
        </div>
        <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : !products?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products yet.</TableCell></TableRow>
            ) : products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-12 w-10 object-cover rounded bg-muted" /> : <div className="h-12 w-10 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>{product.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{product.categoryName || "-"}</span>
                    {product.subcategoryName && <span className="text-xs text-muted-foreground">{product.subcategoryName}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>৳{product.price}</span>
                    {product.originalPrice && <span className="text-xs text-muted-foreground line-through">৳{product.originalPrice}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {product.inStock ? <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">In Stock</Badge> : <Badge variant="destructive">Out of Stock</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Product" : "Create Product"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Price (৳) *</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Original Price (৳)</Label><Input type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories?.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!categoryId || categoryId === "none"}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredSubcategories.map(sub => <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Sizes (comma separated)</Label><Input value={sizesStr} onChange={(e) => setSizesStr(e.target.value)} placeholder="S, M, L, XL" /></div>
              <div className="space-y-2"><Label>Colors (comma separated)</Label><Input value={colorsStr} onChange={(e) => setColorsStr(e.target.value)} placeholder="Black, White" /></div>
            </div>
            <ImageUpload value={imageUrl} onChange={setImageUrl} label="Primary Image" />
            <div className="space-y-2 border-t pt-4">
              <Label>Additional Gallery Images</Label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group w-16 h-20 bg-muted rounded overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={extraImageUrl} onChange={(e) => setExtraImageUrl(e.target.value)} placeholder="Paste image URL and click Add" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraImage(); } }} />
                <Button type="button" onClick={addExtraImage} variant="outline">Add</Button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5"><Label>In Stock</Label><p className="text-xs text-muted-foreground">Available for purchase</p></div>
              <Switch checked={inStock} onCheckedChange={setInStock} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
