import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  productId: number;
  productName: string;
  price: string;
  quantity: number;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number, size: string | null, color: string | null) => void;
  updateQuantity: (productId: number, size: string | null, color: string | null, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("hasanaa_cart");
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hasanaa_cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems(current => {
      const existingIndex = current.findIndex(
        i => i.productId === newItem.productId && i.size === newItem.size && i.color === newItem.color
      );
      
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }
      
      return [...current, newItem];
    });
  };

  const removeFromCart = (productId: number, size: string | null, color: string | null) => {
    setItems(current => 
      current.filter(i => !(i.productId === productId && i.size === size && i.color === color))
    );
  };

  const updateQuantity = (productId: number, size: string | null, color: string | null, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    
    setItems(current => {
      const existingIndex = current.findIndex(
        i => i.productId === productId && i.size === size && i.color === color
      );
      
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex].quantity = quantity;
        return updated;
      }
      return current;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  const cartTotal = items.reduce((total, item) => {
    return total + (parseFloat(item.price) * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
