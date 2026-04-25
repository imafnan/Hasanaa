import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: categories } = useListCategories({
    query: {
      queryKey: getListCategoriesQueryKey(),
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6 text-foreground" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetTitle className="text-left text-2xl font-serif text-primary">Hasanaa</SheetTitle>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Home
                  </Link>
                  <div className="h-px bg-border my-2" />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Categories</span>
                  {categories?.map((cat) => (
                    <Link 
                      key={cat.id} 
                      href={`/category/${cat.id}`} 
                      className="text-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-primary tracking-tight">Hasanaa</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
              Home
            </Link>
            {categories?.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/category/${cat.id}`}
                className={`text-sm font-medium transition-colors hover:text-primary ${location === `/category/${cat.id}` ? "text-primary" : "text-muted-foreground"}`}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5 text-foreground" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                )}
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-primary">Hasanaa</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Premium traditional Islamic menswear and children's clothing. Serving the community with distinguished, elegant attire.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Shop</h4>
              <ul className="space-y-2">
                {categories?.slice(0, 4).map((cat) => (
                  <li key={cat.id}>
                    <Link href={`/category/${cat.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-muted-foreground">Contact Us</span></li>
                <li><span className="text-sm text-muted-foreground">Shipping Policy</span></li>
                <li><span className="text-sm text-muted-foreground">Returns & Exchanges</span></li>
                <li><span className="text-sm text-muted-foreground">Size Guide</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Connect</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to receive updates, access to exclusive deals, and more.
              </p>
              <div className="flex gap-2">
                <input type="email" placeholder="Enter your email" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Hasanaa. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-sm text-muted-foreground">Privacy Policy</span>
              <span className="text-sm text-muted-foreground">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
