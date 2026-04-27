import { Link, useLocation } from "wouter";
import { useAdmin } from "@/lib/admin-context";
import { useAdminLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Tags,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  Layers,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/promotions", label: "Promotions", icon: Layers },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, checkAuth } = useAdmin();
  const [location, setLocation] = useLocation();
  const logout = useAdminLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin && location !== "/admin/login") {
      setLocation("/admin/login");
    }
  }, [isAdmin, isLoading, location, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!isAdmin && location !== "/admin/login") {
    return null;
  }

  if (location === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        checkAuth();
        setLocation("/admin/login");
      }
    });
  };

  const NavLinks = () => (
    <>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
          <span className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location === href || (href !== "/admin" && location.startsWith(href))
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}>
            <Icon className="h-5 w-5" />
            {label}
          </span>
        </Link>
      ))}
      <Button
        variant="ghost"
        className="justify-start px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10 w-full mt-auto"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-3" />
        Logout
      </Button>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card h-screen sticky top-0">
        <div className="p-6 border-b border-border">
          <Link href="/admin" className="text-2xl font-serif font-bold text-primary">Hasanaa Admin</Link>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <NavLinks />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-40 w-full border-b border-border bg-card px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="text-xl font-serif font-bold text-primary">Hasanaa Admin</Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle admin menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col">
              <SheetTitle className="text-left text-2xl font-serif font-bold text-primary border-b border-border pb-4">
                Hasanaa Admin
              </SheetTitle>
              <nav className="flex-1 flex flex-col gap-2 mt-4">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
