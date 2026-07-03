import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import type { Product } from "@workspace/api-client-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-border/50 bg-card group">
        <div className="aspect-[3/4] overflow-hidden bg-muted relative">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          {!product.inStock && (
            <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 text-xs font-bold rounded-sm">
              Out of Stock
            </div>
          )}
        </div>
        <CardContent className="p-4 flex flex-col gap-1">
          <h3 className="font-serif font-semibold text-foreground truncate">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary">৳{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">৳{product.originalPrice}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
