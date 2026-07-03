import { useGetOrder, getGetOrderQueryKey, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminOrderDetails() {
  const { id } = useParams();
  const orderId = Number(id);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const { data: order, isLoading } = useGetOrder(
    orderId,
    { query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId) } }
  );

  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
          toast({ title: "Order status updated" });
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'processing': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-serif font-bold mb-4">Order Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const totalVal = parseFloat(order.totalAmount);
  const deliveryVal = parseFloat(order.deliveryCharge || "0");
  const vatVal = parseFloat((order as any).vat || "0");
  const subtotalVal = order.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
          <Link href="/admin/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              Order #{order.id.toString().padStart(6, '0')}
            </h1>
            <Badge variant="outline" className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="hidden sm:flex">
            <Printer className="mr-2 h-4 w-4" /> Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity border border-border"
                              onClick={() => item.imageUrl && setActiveImageUrl(item.imageUrl)}
                            >
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-secondary/10" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-muted-foreground mt-1 flex gap-2">
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span>Color: {item.color}</span>}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">৳{item.price}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          ৳{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 flex justify-end">
                <div className="w-full sm:w-1/2 space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>৳{subtotalVal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>৳{deliveryVal.toFixed(2)}</span>
                  </div>
                  {vatVal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT</span>
                      <span>৳{vatVal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">৳{totalVal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status</label>
                <Select 
                  value={order.status} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                <p className="font-medium mt-1">Cash on Delivery</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              {(order as any).customerEmail && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p className="font-medium">{(order as any).customerEmail}</p>
                </div>
              )}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Shipping Address</h4>
                <p>{order.customerAddress}</p>
                {((order as any).customerArea || order.customerCity) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {[(order as any).customerArea, order.customerCity].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              {order.notes && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Order Notes</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {activeImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActiveImageUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-background rounded-lg overflow-hidden p-2" onClick={(e) => e.stopPropagation()}>
            <img src={activeImageUrl} alt="Product Preview" className="max-w-full max-h-[80vh] object-contain rounded-md" />
            <button 
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 h-8 w-8 flex items-center justify-center"
              onClick={() => setActiveImageUrl(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
