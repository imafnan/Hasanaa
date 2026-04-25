import { useState } from "react";
import { 
  useListProducts, getListProductsQueryKey, 
  useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListCategories, getListCategoriesQueryKey 
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
  const { data: products, isLoading } = useListProducts(
    {}, 
    { query: { queryKey: getListProductsQueryKey({}) } }
  );
  
  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });
  
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sizesStr, setSizesStr] = useState("");
  const [colorsStr, setColorsStr] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setImageUrl("");
    setImages([]);
    setCategoryId("");
    setInStock(true);
    setIsFeatured(false);
    setSizesStr("");
    setColorsStr("");
    setEditingId(null);
  };

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.price);
      setOriginalPrice(product.originalPrice || "");
      setImageUrl(product.imageUrl || "");
      setImages(product.images || []);
      setCategoryId(product.categoryId ? product.categoryId.toString() : "");
      setInStock(product.inStock);
      setIsFeatured(product.isFeatured);
      setSizesStr((product.sizes || []).join(", "));
      setColorsStr((product.colors || []).join(", "));
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price) {
      toast({ title: "Validation Error", description: "Name and price are required.", variant: "destructive" });
      return;
    }

    const payload = {
      name,
      description: description || null,
      price,
      originalPrice: originalPrice || null,
      imageUrl: imageUrl || null,
      images,
      categoryId: categoryId ? parseInt(categoryId) : null,
      inStock,
      isFeatured,
      sizes: sizesStr.split(",").map(s => s.trim()).filter(Boolean),
      colors: colorsStr.split(",").map(c => c.trim()).filter(Boolean)
    };

    if (editingId) {
      updateProduct.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
            toast({ title: "Product updated successfully" });
            setIsDialogOpen(false);
          }
        }
      );
    } else {
      createProduct.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
            toast({ title: "Product created successfully" });
            setIsDialogOpen(false);
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
            toast({ title: "Product deleted successfully" });
          }
        }
      );
    }
  };

  const addExtraImage = (url: string) => {
    if (url && !images.includes(url)) {
      setImages([...images, url]);
    }
  };

  const removeExtraImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
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
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-12 w-10 object-cover rounded bg-muted" />
                    ) : (
                      <div className="h-12 w-10 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>
                    {product.name}
                  </TableCell>
                  <TableCell>{product.categoryName || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>৳{product.price}</span>
                      {product.originalPrice && <span className="text-xs text-muted-foreground line-through">৳{product.originalPrice}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.inStock ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10">In Stock</Badge>
                    ) : (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.isFeatured && <Badge variant="secondary">Featured</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Create New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (৳) *</Label>
                  <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (৳) (Optional)</Label>
                  <Input id="originalPrice" type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sizes">Sizes (comma separated)</Label>
                  <Input id="sizes" value={sizesStr} onChange={(e) => setSizesStr(e.target.value)} placeholder="S, M, L, XL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colors">Colors (comma separated)</Label>
                  <Input id="colors" value={colorsStr} onChange={(e) => setColorsStr(e.target.value)} placeholder="Black, White, Green" />
                </div>
              </div>

              <div className="space-y-2">
                <ImageUpload 
                  value={imageUrl} 
                  onChange={setImageUrl} 
                  label="Primary Image" 
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label>Additional Gallery Images</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group w-16 h-20 bg-muted rounded overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeExtraImage(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Image URL" 
                    id="extraImageInput"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        addExtraImage(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <Button type="button" onClick={() => {
                    const input = document.getElementById('extraImageInput') as HTMLInputElement;
                    addExtraImage(input.value);
                    input.value = '';
                  }}>Add</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inStock">In Stock</Label>
                    <p className="text-xs text-muted-foreground">Available for purchase</p>
                  </div>
                  <Switch id="inStock" checked={inStock} onCheckedChange={setInStock} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="featured">Featured</Label>
                    <p className="text-xs text-muted-foreground">Show on homepage</p>
                  </div>
                  <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
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
