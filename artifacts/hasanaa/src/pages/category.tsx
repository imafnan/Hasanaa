import { useGetCategory, getGetCategoryQueryKey, useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { ProductCard } from "@/components/product-card";

export default function CategoryPage() {
  const { id } = useParams();
  const categoryId = id === "all" ? undefined : Number(id);

  const { data: category, isLoading: loadingCategory } = useGetCategory(
    Number(categoryId),
    { 
      query: { 
        enabled: !!categoryId,
        queryKey: getGetCategoryQueryKey(Number(categoryId)) 
      } 
    }
  );

  const { data: products, isLoading: loadingProducts } = useListProducts(
    categoryId ? { categoryId } : {},
    { 
      query: { 
        queryKey: getListProductsQueryKey(categoryId ? { categoryId } : {}) 
      } 
    }
  );

  const isLoading = loadingCategory || loadingProducts;
  const displayTitle = id === "all" ? "All Products" : category?.name || "Loading...";

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">
          {displayTitle}
        </h1>
        <div className="h-1 w-20 bg-secondary mx-auto rounded-full" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No products found in this category.</p>
        </div>
      )}
    </div>
  );
}
