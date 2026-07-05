import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export default function OrderSuccessPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) {
      window.location.href = "/";
    }
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center min-h-[60vh]">
      <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Order Successful!</h1>
      <p className="text-muted-foreground mb-2 text-lg">Thank you for your purchase.</p>
      <p className="text-muted-foreground mb-8 max-w-md">
        Your order #{orderId} has been received and is currently being processed. You will receive a confirmation call shortly.
      </p>
      
      <div className="flex gap-4">
        <Button asChild size="lg" className="font-medium">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
