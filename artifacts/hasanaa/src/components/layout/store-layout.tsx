import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart-context";
import { ShoppingBag, Menu, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { useListCategories, getListCategoriesQueryKey, useListSubcategories, getListSubcategoriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredCatId, setHoveredCatId] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const { data: allSubcategories } = useListSubcategories({}, { query: { queryKey: getListSubcategoriesQueryKey({}) } });

  const activeCategories = (categories || []).filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  const getSubsFor = (catId: number) => (allSubcategories || []).filter(s => s.categoryId === catId && s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  const handleMouseEnterCat = (catId: number) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredCatId(catId);
  };

  const handleMouseLeaveCat = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredCatId(null), 150);
  };

  const handleMouseEnterDropdown = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleMouseLeaveDropdown = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredCatId(null), 150);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6 text-foreground" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[360px] overflow-y-auto">
                <SheetTitle className="text-left text-2xl font-serif text-primary">Hasanaa</SheetTitle>
                <nav className="flex flex-col gap-1 mt-6">
                  <Link href="/" className="text-base font-medium px-2 py-2 rounded hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                  <div className="h-px bg-border my-2" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Categories</span>
                  {activeCategories.map((cat) => {
                    const subs = getSubsFor(cat.id);
                    return (
                      <div key={cat.id}>
                        <Link href={`/category/${cat.id}`} className="text-base font-medium px-2 py-2 rounded hover:bg-muted block" onClick={() => setMobileMenuOpen(false)}>
                          {cat.name}
                        </Link>
                        {subs.length > 0 && (
                          <div className="pl-4 flex flex-col gap-0.5 mb-1">
                            {subs.map(sub => (
                              <Link key={sub.id} href={`/subcategory/${sub.id}`} className="text-sm text-muted-foreground px-2 py-1.5 rounded hover:bg-muted hover:text-foreground block" onClick={() => setMobileMenuOpen(false)}>
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-primary tracking-tight">Hasanaa</span>
            </Link>
          </div>

          {/* Desktop nav with hover dropdowns */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className={`px-3 py-2 text-sm font-medium transition-colors rounded hover:text-primary hover:bg-muted/50 ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
              Home
            </Link>
            {activeCategories.map((cat) => {
              const subs = getSubsFor(cat.id);
              const isActive = location === `/category/${cat.id}` || location.startsWith(`/category/${cat.id}/`);
              return (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnterCat(cat.id)}
                  onMouseLeave={handleMouseLeaveCat}
                >
                  <Link
                    href={`/category/${cat.id}`}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded hover:text-primary hover:bg-muted/50 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {cat.name}
                    {subs.length > 0 && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${hoveredCatId === cat.id ? "rotate-180" : ""}`} />}
                  </Link>
                  {subs.length > 0 && hoveredCatId === cat.id && (
                    <div
                      className="absolute top-full left-0 mt-1 w-52 bg-card border border-border rounded-lg shadow-lg py-2 z-50"
                      onMouseEnter={handleMouseEnterDropdown}
                      onMouseLeave={handleMouseLeaveDropdown}
                    >
                      {subs.map(sub => (
                        <Link
                          key={sub.id}
                          href={`/subcategory/${sub.id}`}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

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
                {activeCategories.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <Link href={`/category/${cat.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">{cat.name}</Link>
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
              <p className="text-sm text-muted-foreground mb-4">Subscribe for exclusive deals and updates.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Enter your email" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Hasanaa. All rights reserved.</p>
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
