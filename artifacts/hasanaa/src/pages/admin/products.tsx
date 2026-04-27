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
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Layers, X, Check } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { MultiImageUpload } from "@/components/multi-image-upload";
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
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [sizeChartUrl, setSizeChartUrl] = useState("");
  const [variantIds, setVariantIds] = useState<number[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [inStock, setInStock] = useState(true);
  const [sizesStr, setSizesStr] = useState("");
  const [colorsStr, setColorsStr] = useState("");
  const [variantSearch, setVariantSearch] = useState("");

  const filteredSubcategories = allSubcategories?.filter(s => !categoryId || s.categoryId === parseInt(categoryId)) || [];

  const availableVariants = (products || []).filter(p =>
    p.id !== editingId &&
    (!variantSearch || p.name.toLowerCase().includes(variantSearch.toLowerCase()))
  );

  const resetForm = () => {
    setName(""); setDescription(""); setPrice(""); setOriginalPrice("");
    setImageUrl(""); setImages([]); setSizeChartUrl(""); setVariantIds([]);
    setCategoryId(""); setSubcategoryId(""); setInStock(true);
    setSizesStr(""); setColorsStr(""); setEditingId(null);
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingId(product.id); setName(product.name); setDescription(product.description || "");
      setPrice(product.price); setOriginalPrice(product.originalPrice || "");
      setImageUrl(product.imageUrl || ""); setImages(product.images || []);
      setSizeChartUrl(product.sizeChartUrl || ""); setVariantIds(product.variantIds || []);
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
    const payload: any = {
      name, description: description || null, price,
      originalPrice: originalPrice || null, imageUrl: imageUrl || null, images,
      sizeChartUrl: sizeChartUrl || null,
      variantIds,
      categoryId: categoryId && categoryId !== "none" ? parseInt(categoryId) : null,
      subcategoryId: subcategoryId && subcategoryId !== "none" ? parseInt(subcategoryId) : null,
      inStock,
      sizes: sizesStr.split(",").map(s => s.trim()).filter(Boolean),
      colors: colorsStr.split(",").map(c => c.trim()).filter(Boolean),
    };
    const onSuccess = () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({}) }); toast({ title: editingId ? "Product updated" : "Product created" }); setIsDialogOpen(false); resetForm(); };
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

  const toggleVariant = (id: number) => {
    setVariantIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const selectedVariantNames = variantIds.map(vid => {
    const p = (products || []).find(p => p.id === vid);
    return p ? p.name : `#${vid}`;
  });

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

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-2"><Label>Colors (comma separated)</Label><Input value={colorsStr} onChange={(e) => setColorsStr(e.target.value)} placeholder="Royal Blue, Teal" /></div>
            </div>

            {/* Product Photos */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-base font-semibold">Product Photos</Label>
              <p className="text-xs text-muted-foreground">First image will be used as cover. Upload multiple photos at once.</p>
              <MultiImageUpload
                values={imageUrl ? [imageUrl, ...images] : images}
                onChange={(urls) => {
                  const [first, ...rest] = urls;
                  setImageUrl(first || "");
                  setImages(rest);
                }}
                label=""
                maxImages={8}
              />
            </div>

            {/* Size Chart */}
            <div className="border-t pt-4">
              <ImageUpload value={sizeChartUrl} onChange={setSizeChartUrl} label="Size Chart Image (optional)" />
            </div>

            {/* Product Variants */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Product Variants</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Link related products (e.g. same item in different colors)</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => { setVariantSearch(""); setIsVariantDialogOpen(true); }}>
                  <Layers className="h-4 w-4 mr-2" />
                  Select Variants
                </Button>
              </div>
              {variantIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedVariantNames.map((name, i) => (
                    <Badge key={variantIds[i]} variant="secondary" className="gap-1.5">
                      {name}
                      <button type="button" onClick={() => toggleVariant(variantIds[i])} className="ml-0.5 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {variantIds.length === 0 && (
                <p className="text-xs text-muted-foreground">No variants selected</p>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5"><Label>In Stock</Label><p className="text-xs text-muted-foreground">Available for purchase</p></div>
              <Switch checked={inStock} onCheckedChange={setInStock} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Variant Selection Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Select Product Variants</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Select products to show as color/style variants on the product page.</p>
          <Input
            placeholder="Search products..."
            value={variantSearch}
            onChange={(e) => setVariantSearch(e.target.value)}
            className="mt-2"
          />
          <div className="flex-1 overflow-y-auto mt-3 space-y-1 pr-1">
            {availableVariants.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No products found</p>
            ) : availableVariants.map(p => {
              const selected = variantIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleVariant(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  }`}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-10 h-12 object-cover rounded bg-muted flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">৳{p.price}{p.categoryName ? ` · ${p.categoryName}` : ""}</p>
                  </div>
                  {selected && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">{variantIds.length} variant{variantIds.length !== 1 ? "s" : ""} selected</span>
            <Button onClick={() => setIsVariantDialogOpen(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
