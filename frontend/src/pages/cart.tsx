import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Looks like you haven't added anything to your cart yet. Discover our premium collection of traditional menswear.
        </p>
        <Button asChild size="lg">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-border text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-6 md:space-y-0 md:divide-y md:divide-border">
            {items.map((item, index) => (
              <div key={`${item.productId}-${item.size}-${item.color}-${index}`} className="md:py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center border border-border p-4 md:border-0 md:p-0 rounded-lg md:rounded-none">
                <div className="col-span-1 md:col-span-6 flex gap-4">
                  <div className="w-20 md:w-24 aspect-[3/4] bg-muted rounded-md overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-secondary/10">No img</div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <Link href={`/product/${item.productId}`} className="font-serif font-semibold text-foreground hover:text-primary transition-colors text-lg line-clamp-2">
                      {item.productName}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-col gap-0.5">
                      <span>৳{item.price}</span>
                      <div className="flex gap-2 mt-1">
                        {item.size && <span className="bg-muted px-2 py-0.5 rounded text-xs">Size: {item.size}</span>}
                        {item.color && <span className="bg-muted px-2 py-0.5 rounded text-xs">Color: {item.color}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3 flex items-center md:justify-center mt-2 md:mt-0">
                  <div className="flex items-center border border-border rounded-md h-10 w-full md:w-auto">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                      className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="w-10 h-full flex items-center justify-center font-medium text-sm text-foreground">
                      {item.quantity}
                    </div>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                      className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end mt-2 md:mt-0 font-medium text-primary">
                  <span className="md:hidden text-muted-foreground text-sm font-normal">Subtotal:</span>
                  ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                </div>

                <div className="col-span-1 flex items-center justify-end md:justify-center absolute top-4 right-4 md:relative md:top-auto md:right-auto">
                  <button 
                    onClick={() => removeFromCart(item.productId, item.size, item.color)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>৳{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex justify-between font-bold text-lg text-foreground">
                <span>Total</span>
                <span className="text-primary">৳{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button asChild className="w-full h-12 text-lg">
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            
            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-primary hover:underline font-medium">
                or Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
