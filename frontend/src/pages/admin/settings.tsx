import { useGetDeliveryCharge, getGetDeliveryChargeQueryKey, useUpdateDeliveryCharge } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminSettings() {
  const { data, isLoading } = useGetDeliveryCharge();
  const updateDeliveryCharge = useUpdateDeliveryCharge();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [deliveryCharge, setDeliveryCharge] = useState<string>("");
  const [vat, setVat] = useState<string>("");

  useEffect(() => {
    if (data?.deliveryCharge !== undefined) {
      setDeliveryCharge(String(data.deliveryCharge));
    }
    if (data?.vat !== undefined) {
      setVat(String(data.vat));
    }
  }, [data]);

  const handleSave = () => {
    const chargeValue = parseFloat(deliveryCharge);
    const vatValue = parseFloat(vat);

    if (isNaN(chargeValue) || chargeValue < 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid non-negative number for the delivery charge.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(vatValue) || vatValue < 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid non-negative number for the VAT percentage.",
        variant: "destructive",
      });
      return;
    }

    updateDeliveryCharge.mutate(
      { data: { deliveryCharge: chargeValue, vat: vatValue } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getGetDeliveryChargeQueryKey() });
          toast({
            title: "Settings saved",
            description: `Settings updated: Delivery charge ৳${res.deliveryCharge.toFixed(2)}, VAT ${res.vat}%`,
          });
        },
        onError: (err: any) => {
          toast({
            title: "Error saving settings",
            description: err.message || "Failed to update settings.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system configurations and options</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Charge & VAT Settings</CardTitle>
          <CardDescription>
            Configure the delivery charge and VAT percentage applied to customer checkouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-charge">Delivery Fee (৳)</Label>
              <Input
                id="delivery-charge"
                type="number"
                min="0"
                step="any"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat-rate">VAT (%)</Label>
              <Input
                id="vat-rate"
                type="number"
                min="0"
                step="any"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSave} 
              disabled={updateDeliveryCharge.isPending}
            >
              {updateDeliveryCharge.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
