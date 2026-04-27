import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, Minus, Plus, ShoppingCart, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProductPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
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
  const [showSizeChart, setShowSizeChart] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-3 max-w-sm mx-auto w-full">
            <div className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => <div key={i} className="w-16 aspect-[3/4] bg-muted animate-pulse rounded" />)}
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
  const variants = (product as any).variants || [];

  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) { toast({ title: "Please select a size", variant: "destructive" }); return; }
    if (product.colors?.length && !selectedColor) { toast({ title: "Please select a color", variant: "destructive" }); return; }
    addToCart({ productId: product.id, productName: product.name, price: product.price, quantity, size: selectedSize, color: selectedColor, imageUrl: product.imageUrl });
    toast({ title: "Added to Cart", description: `${quantity}x ${product.name} added to your cart.` });
  };

  const discountPct = product.originalPrice
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Breadcrumbs */}
      <div className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground mb-6">
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

      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        {/* Product Image Gallery */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[380px]">
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-muted rounded-xl overflow-hidden border border-border shadow group">
              {currentImage ? (
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex(i => (i + 1) % allImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              {discountPct > 0 && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-destructive text-destructive-foreground text-xs font-bold">{discountPct}% OFF</Badge>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative flex-shrink-0 w-[60px] aspect-[3/4] rounded-md overflow-hidden border-2 transition-all ${
                      activeImageIndex === i ? "border-primary shadow-sm" : "border-transparent opacity-60 hover:opacity-90 hover:border-border"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Image count indicator */}
            {allImages.length > 1 && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                {activeImageIndex + 1} / {allImages.length}
              </p>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">{product.name}</h1>
            {(product as any).sku && <p className="text-sm text-muted-foreground mb-2">Product Code: {(product as any).sku}</p>}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-bold text-primary">৳{product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-base text-muted-foreground line-through">৳{product.originalPrice}</span>
                  <Badge variant="destructive" className="text-xs">{discountPct}% OFF</Badge>
                </>
              )}
            </div>
            <div>
              {product.inStock ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
          </div>

          {product.description && (
            <div className="mb-4 text-muted-foreground text-sm leading-relaxed">
              <p>{product.description}</p>
            </div>
          )}

          <div className="h-px bg-border w-full my-4" />

          {/* Variants (color options via linked products) */}
          {variants.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                {selectedColor ? `Color: ${selectedColor}` : "Color"}
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Current product as first swatch */}
                <button
                  onClick={() => {}}
                  className="relative flex-shrink-0 w-[72px] aspect-[3/4] rounded-lg overflow-hidden border-2 border-primary shadow-md transition-all"
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                  <div className="absolute inset-0 ring-2 ring-primary ring-inset rounded-lg" />
                </button>
                {/* Variant swatches */}
                {variants.map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={() => setLocation(`/product/${variant.id}`)}
                    className="relative flex-shrink-0 w-[72px] aspect-[3/4] rounded-lg overflow-hidden border-2 border-transparent opacity-75 hover:opacity-100 hover:border-border transition-all"
                    title={variant.name}
                  >
                    {variant.imageUrl ? (
                      <img src={variant.imageUrl} alt={variant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center">{variant.name}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5 mb-6">
            {/* Color selection (text-based) — shown only if no variant images */}
            {product.colors && product.colors.length > 0 && variants.length === 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                  {selectedColor ? `Color: ${selectedColor}` : "Select Color"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-10 px-4 border-2 rounded-lg text-sm font-medium transition-all ${
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

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Select Size</h3>
                  {(product as any).sizeChartUrl && (
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Ruler className="h-3 w-3" />
                      Size Guide
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-[44px] px-4 border-2 rounded-lg text-sm font-medium transition-all ${
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
          </div>

          {/* Quantity + Add to Cart */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex gap-3">
              <div className="flex items-center border-2 border-border rounded-lg overflow-hidden h-12">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" disabled={!product.inStock}>
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-10 h-full flex items-center justify-center font-semibold text-foreground border-x border-border">
                  {quantity}
                </div>
                <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" disabled={!product.inStock}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button className="flex-1 h-12 text-base font-medium" disabled={!product.inStock} onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>
            {!product.inStock && <p className="text-sm text-destructive text-center">This item is currently out of stock.</p>}
          </div>
        </div>
      </div>

      {/* Size Chart Dialog */}
      {(product as any).sizeChartUrl && (
        <Dialog open={showSizeChart} onOpenChange={setShowSizeChart}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Size Guide</DialogTitle></DialogHeader>
            <img src={(product as any).sizeChartUrl} alt="Size Chart" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
