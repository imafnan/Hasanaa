import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { CartProvider } from "@/lib/cart-context";
import { AdminProvider } from "@/lib/admin-context";

import { StoreLayout } from "@/components/layout/store-layout";
import { AdminLayout } from "@/components/layout/admin-layout";

import Home from "@/pages/home";
import CategoryPage from "@/pages/category";
import SubcategoryPage from "@/pages/subcategory";
import ProductPage from "@/pages/product";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import OrderSuccessPage from "@/pages/order-success";

import AdminLogin from "@/pages/admin/admin-login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminBanners from "@/pages/admin/banners";
import AdminCategories from "@/pages/admin/categories";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminOrderDetails from "@/pages/admin/order-details";
import AdminPromotions from "@/pages/admin/promotions";
import AdminSettings from "@/pages/admin/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function StoreRoutes() {
  return (
    <StoreLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/category/:id" component={CategoryPage} />
        <Route path="/subcategory/:id" component={SubcategoryPage} />
        <Route path="/product/:id" component={ProductPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/order-success" component={OrderSuccessPage} />
        <Route component={NotFound} />
      </Switch>
    </StoreLayout>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/banners" component={AdminBanners} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/orders/:id" component={AdminOrderDetails} />
        <Route path="/admin/promotions" component={AdminPromotions} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminRoutes} />
      <Route path="/admin" component={AdminRoutes} />
      <Route path="/admin/:rest*" component={AdminRoutes} />
      <Route component={StoreRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </CartProvider>
        </AdminProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
