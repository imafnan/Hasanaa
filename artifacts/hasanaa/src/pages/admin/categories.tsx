import { useState } from "react";
import {
  useListCategories, getListCategoriesQueryKey, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useListSubcategories, getListSubcategoriesQueryKey, useCreateSubcategory, useUpdateSubcategory, useDeleteSubcategory,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, ChevronDown, ChevronRight } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

export default function AdminCategories() {
  const { data: categories, isLoading } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const { data: allSubcategories } = useListSubcategories({}, { query: { queryKey: getListSubcategoriesQueryKey({}) } });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createSubcategory = useCreateSubcategory();
  const updateSubcategory = useUpdateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);

  // Category form
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catParentTag, setCatParentTag] = useState("");
  const [catIsActive, setCatIsActive] = useState(true);
  const [catSortOrder, setCatSortOrder] = useState("0");

  // Subcategory form
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [subImageUrl, setSubImageUrl] = useState("");
  const [subIsActive, setSubIsActive] = useState(true);
  const [subSortOrder, setSubSortOrder] = useState("0");

  const autoSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const openCatDialog = (cat?: any) => {
    if (cat) {
      setEditingCatId(cat.id); setCatName(cat.name); setCatSlug(cat.slug);
      setCatImageUrl(cat.imageUrl || ""); setCatParentTag(cat.parentTag || "");
      setCatIsActive(cat.isActive); setCatSortOrder(String(cat.sortOrder));
    } else {
      setEditingCatId(null); setCatName(""); setCatSlug(""); setCatImageUrl(""); setCatParentTag(""); setCatIsActive(true); setCatSortOrder("0");
    }
    setIsCatDialogOpen(true);
  };

  const openSubDialog = (categoryId: number, sub?: any) => {
    if (sub) {
      setEditingSubId(sub.id); setSubName(sub.name); setSubSlug(sub.slug);
      setSubCategoryId(String(sub.categoryId)); setSubImageUrl(sub.imageUrl || "");
      setSubIsActive(sub.isActive); setSubSortOrder(String(sub.sortOrder));
    } else {
      setEditingSubId(null); setSubName(""); setSubSlug(""); setSubImageUrl(""); setSubIsActive(true); setSubSortOrder("0");
      setSubCategoryId(String(categoryId));
    }
    setIsSubDialogOpen(true);
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    const payload = { name: catName, slug: catSlug || autoSlug(catName), imageUrl: catImageUrl || null, parentTag: catParentTag || null, isActive: catIsActive, sortOrder: parseInt(catSortOrder) || 0 };
    const onSuccess = () => { queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }); toast({ title: editingCatId ? "Category updated" : "Category created" }); setIsCatDialogOpen(false); };
    if (editingCatId) {
      updateCategory.mutate({ id: editingCatId, data: payload }, { onSuccess });
    } else {
      createCategory.mutate({ data: payload }, { onSuccess });
    }
  };

  const handleSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subCategoryId) return;
    const payload = { name: subName, slug: subSlug || autoSlug(subName), categoryId: parseInt(subCategoryId), imageUrl: subImageUrl || null, isActive: subIsActive, sortOrder: parseInt(subSortOrder) || 0 };
    const onSuccess = () => { queryClient.invalidateQueries({ queryKey: getListSubcategoriesQueryKey({}) }); toast({ title: editingSubId ? "Subcategory updated" : "Subcategory created" }); setIsSubDialogOpen(false); };
    if (editingSubId) {
      updateSubcategory.mutate({ id: editingSubId, data: payload }, { onSuccess });
    } else {
      createSubcategory.mutate({ data: payload }, { onSuccess });
    }
  };

  const handleDeleteCat = (id: number) => {
    if (confirm("Delete this category? All subcategories will also be deleted.")) {
      deleteCategory.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }); toast({ title: "Category deleted" }); } });
    }
  };

  const handleDeleteSub = (id: number) => {
    if (confirm("Delete this subcategory?")) {
      deleteSubcategory.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListSubcategoriesQueryKey({}) }); toast({ title: "Subcategory deleted" }); } });
    }
  };

  const getSubsForCategory = (catId: number) => (allSubcategories || []).filter(s => s.categoryId === catId).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage categories and subcategories</p>
        </div>
        <Button onClick={() => openCatDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : !categories?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No categories yet.</TableCell></TableRow>
            ) : categories?.map((cat) => {
              const subs = getSubsForCategory(cat.id);
              const isExpanded = expandedCategoryId === cat.id;
              return (
                <>
                  <TableRow key={cat.id}>
                    <TableCell>
                      <button onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)} className="p-1 text-muted-foreground hover:text-foreground">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      {cat.imageUrl ? <img src={cat.imageUrl} alt={cat.name} className="h-10 w-10 object-cover rounded bg-muted" /> : <div className="h-10 w-10 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${cat.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{cat.isActive ? "Active" : "Inactive"}</span>
                    </TableCell>
                    <TableCell>{cat.sortOrder}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openSubDialog(cat.id)}>
                        <Plus className="h-3 w-3 mr-1" />Sub
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openCatDialog(cat)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCat(cat.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (subs.length === 0 ? (
                    <TableRow key={`${cat.id}-empty`} className="bg-muted/20">
                      <TableCell colSpan={7} className="pl-16 py-3 text-sm text-muted-foreground italic">No subcategories yet. Click "+ Sub" to add one.</TableCell>
                    </TableRow>
                  ) : subs.map(sub => (
                    <TableRow key={`sub-${sub.id}`} className="bg-muted/20">
                      <TableCell />
                      <TableCell>
                        <div className="pl-4">
                          {sub.imageUrl ? <img src={sub.imageUrl} alt={sub.name} className="h-8 w-8 object-cover rounded bg-muted" /> : <div className="h-8 w-8 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-3 w-3 text-muted-foreground" /></div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm pl-6"><span className="text-muted-foreground">↳ </span>{sub.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{sub.slug}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${sub.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{sub.isActive ? "Active" : "Inactive"}</span>
                      </TableCell>
                      <TableCell className="text-sm">{sub.sortOrder}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openSubDialog(cat.id, sub)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSub(sub.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )))}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Category Dialog */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCatId ? "Edit Category" : "Create Category"}</DialogTitle></DialogHeader>
          <form onSubmit={handleCatSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={catName} onChange={(e) => { setCatName(e.target.value); if (!editingCatId) setCatSlug(autoSlug(e.target.value)); }} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={catSlug} onChange={(e) => setCatSlug(e.target.value)} placeholder="auto-generated" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parent Tag</Label>
              <Input value={catParentTag} onChange={(e) => setCatParentTag(e.target.value)} placeholder="e.g. men, kids-wear" />
            </div>
            <ImageUpload value={catImageUrl} onChange={setCatImageUrl} label="Category Image" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={catSortOrder} onChange={(e) => setCatSortOrder(e.target.value)} /></div>
              <div className="flex items-center gap-3 pt-6"><Switch checked={catIsActive} onCheckedChange={setCatIsActive} /><Label>Active</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCatDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCatId ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingSubId ? "Edit Subcategory" : "Create Subcategory"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Parent Category *</Label>
              <Select value={subCategoryId} onValueChange={setSubCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories?.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={subName} onChange={(e) => { setSubName(e.target.value); if (!editingSubId) setSubSlug(autoSlug(e.target.value)); }} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={subSlug} onChange={(e) => setSubSlug(e.target.value)} placeholder="auto-generated" />
              </div>
            </div>
            <ImageUpload value={subImageUrl} onChange={setSubImageUrl} label="Subcategory Image" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={subSortOrder} onChange={(e) => setSubSortOrder(e.target.value)} /></div>
              <div className="flex items-center gap-3 pt-6"><Switch checked={subIsActive} onCheckedChange={setSubIsActive} /><Label>Active</Label></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSubDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createSubcategory.isPending || updateSubcategory.isPending}>
                {(createSubcategory.isPending || updateSubcategory.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSubId ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
