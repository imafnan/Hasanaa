import { useGetSubcategory, getGetSubcategoryQueryKey, useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { ProductCard } from "@/components/product-card";
import { ChevronRight, Loader2 } from "lucide-react";

export default function SubcategoryPage() {
  const { id } = useParams();

  const { data: subcategory, isLoading: loadingSub } = useGetSubcategory(
    Number(id),
    { query: { enabled: !!id, queryKey: getGetSubcategoryQueryKey(Number(id)) } }
  );

  const { data: products, isLoading: loadingProducts } = useListProducts(
    { subcategoryId: id ? Number(id) : undefined },
    { query: { enabled: !!id, queryKey: getListProductsQueryKey({ subcategoryId: id ? Number(id) : undefined }) } }
  );

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const parentCategory = subcategory ? categories?.find(c => c.id === subcategory.categoryId) : null;

  if (loadingSub) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subcategory) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Subcategory Not Found</h2>
        <Link href="/" className="text-primary hover:underline">Back to Home</Link>
      </div>
    );
  }

  const activeProducts = (products || []).filter(p => p.inStock !== false);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        {subcategory.categoryId && (
          <>
            <Link href={`/category/${subcategory.categoryId}`} className="hover:text-primary transition-colors">
              {parentCategory?.name || "Category"}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground">{subcategory.name}</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        {subcategory.imageUrl && (
          <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6 bg-muted">
            <img src={subcategory.imageUrl} alt={subcategory.name} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">{subcategory.name}</h1>
        {activeProducts.length > 0 && (
          <p className="text-muted-foreground">{activeProducts.length} product{activeProducts.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Products */}
      {loadingProducts ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : activeProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {activeProducts.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">No products in this subcategory yet.</p>
          <Link href="/" className="text-primary hover:underline text-sm">Continue shopping</Link>
        </div>
      )}
    </div>
  );
}
