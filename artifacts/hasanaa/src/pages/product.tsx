import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProductPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { addToCart } = useCart();

  const { data: product, isLoading } = useGetProduct(
    Number(id),
    { query: { enabled: !!id, queryKey: getGetProductQueryKey(Number(id)) } }
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-3">
            <div className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            <div className="flex gap-3">
              {[1, 2, 3].map(i => <div key={i} className="w-20 aspect-[3/4] bg-muted animate-pulse rounded" />)}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-10 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-6 w-1/4 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-4 bg-muted animate-pulse rounded" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Product Not Found</h2>
        <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild><Link href="/">Back to Home</Link></Button>
      </div>
    );
  }

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];
  const currentImage = allImages[activeImageIndex] ?? null;

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) { toast({ title: "Please select a size", variant: "destructive" }); return; }
    if (product.colors?.length && !selectedColor) { toast({ title: "Please select a color", variant: "destructive" }); return; }
    addToCart({ productId: product.id, productName: product.name, price: product.price, quantity, size: selectedSize, color: selectedColor, imageUrl: product.imageUrl });
    toast({ title: "Added to Cart", description: `${quantity}x ${product.name} added to your cart.` });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        {product.categoryId && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/category/${product.categoryId}`} className="hover:text-primary transition-colors">
              {product.categoryName || "Category"}
            </Link>
          </>
        )}
        {(product as any).subcategoryId && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/subcategory/${(product as any).subcategoryId}`} className="hover:text-primary transition-colors">
              {(product as any).subcategoryName || "Subcategory"}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
        {/* Product Image Gallery */}
        <div className="space-y-3">
          {/* Main Image */}
          <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden border border-border shadow-sm">
            {currentImage ? (
              <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image available</div>
            )}
          </div>
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative flex-shrink-0 w-[72px] aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                    activeImageIndex === i ? "border-primary shadow-md" : "border-transparent opacity-70 hover:opacity-100 hover:border-border"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">{product.name}</h1>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-2xl font-semibold text-primary">৳{product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through mb-0.5">৳{product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <Badge variant="secondary" className="mb-0.5 text-xs">
                  {Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)}% OFF
                </Badge>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {product.inStock ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
          </div>

          <div className="h-px bg-border w-full my-5" />

          {product.description && (
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p>{product.description}</p>
            </div>
          )}

          <div className="space-y-6 mb-8">
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Size</h3>
                  <span className="text-xs text-primary underline cursor-pointer">Size Guide</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 min-w-[44px] px-4 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-11 px-4 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="mt-auto pt-6 border-t border-border">
            <div className="flex gap-3 mb-4">
              <div className="flex items-center border-2 border-border rounded-lg overflow-hidden h-14">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40" disabled={!product.inStock}>
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-12 h-full flex items-center justify-center font-semibold text-foreground border-x border-border">
                  {quantity}
                </div>
                <button onClick={() => setQuantity(q => q + 1)} className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40" disabled={!product.inStock}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button className="flex-1 h-14 text-lg font-medium" disabled={!product.inStock} onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>
            {!product.inStock && <p className="text-sm text-destructive text-center">This item is currently out of stock.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
