import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateOrder } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  customerAddress: z.string().min(5, "Delivery address is required"),
  customerCity: z.string().min(2, "City is required"),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();
  const { toast } = useToast();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      customerCity: "",
      notes: "",
    },
  });

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

  const shippingCost = 100; // Flat rate shipping for example
  const total = cartTotal + shippingCost;

  const onSubmit = (data: CheckoutFormValues) => {
    createOrder.mutate(
      {
        data: {
          ...data,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
        }
      },
      {
        onSuccess: (order) => {
          clearCart();
          setLocation(`/order-success?orderId=${order.id}`);
        },
        onError: (error: any) => {
          toast({
            title: "Failed to place order",
            description: error.message || "An error occurred while placing your order.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">Delivery Details</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="01XXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="customerCity"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Dhaka" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="House 123, Road 4, Block C..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special instructions for delivery..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-lg h-14"
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  `Place Order - ৳${total.toFixed(2)}`
                )}
              </Button>
            </form>
          </Form>
        </div>

        <div>
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-serif font-bold text-foreground mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="w-16 aspect-[3/4] bg-muted rounded-md overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-semibold text-sm truncate">{item.productName}</h4>
                    <div className="text-xs text-muted-foreground mt-1">
                      Qty: {item.quantity} 
                      {item.size && ` • Size: ${item.size}`}
                      {item.color && ` • Color: ${item.color}`}
                    </div>
                  </div>
                  <div className="font-medium text-sm whitespace-nowrap">
                    ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Subtotal</span>
                <span>৳{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Delivery Fee</span>
                <span>৳{shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Payment Method</span>
                <span>Cash on Delivery</span>
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex justify-between font-bold text-lg text-foreground">
                <span>Total</span>
                <span className="text-primary">৳{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
