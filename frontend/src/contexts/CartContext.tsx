import React, {createContext, useCallback, useContext, useState} from 'react';
import {cartAPI} from '../api';
import {CartItem} from '../types';
import {useAuth} from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  reloadCart: () => Promise<void>;
  loading: boolean;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  reloadCart: async () => {},
  loading: false,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const reloadCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await cartAPI.getCartItems();
      setCartItems(response.data);
    } catch (error) {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    reloadCart();
  }, [reloadCart]);

  return (
    <CartContext.Provider value={{ cartItems, reloadCart, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext); 