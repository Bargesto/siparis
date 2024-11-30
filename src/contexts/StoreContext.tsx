import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product, Order, ProductSize, ShoeSize } from '../types';
import { initialProducts } from '../data/initialProducts';

interface StoreContextType {
  products: Product[];
  orders: Order[];
  siteName: string;
  logoUrl: string;
  setSiteName: (name: string) => void;
  setLogoUrl: (url: string) => void;
  placeOrder: (productId: string, size: ProductSize | ShoeSize, instagramUsername: string) => void;
  getStockForSize: (productId: string, size: ProductSize | ShoeSize) => number;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  editProduct: (productId: string, updatedProduct: Omit<Product, 'id' | 'createdAt'>) => void;
  deleteProduct: (productId: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    const parsedProducts = saved ? JSON.parse(saved) : initialProducts;
    // Add createdAt field to existing products if they don't have it
    return parsedProducts.map((p: Product) => ({
      ...p,
      createdAt: p.createdAt || Date.now()
    }));
  });
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [siteName, setSiteName] = useState(() => {
    const saved = localStorage.getItem('siteName');
    return saved || 'Mezat Sipariş';
  });

  const [logoUrl, setLogoUrl] = useState(() => {
    const saved = localStorage.getItem('logoUrl');
    return saved || '';
  });

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('siteName', siteName);
  }, [siteName]);

  useEffect(() => {
    localStorage.setItem('logoUrl', logoUrl);
  }, [logoUrl]);

  const placeOrder = (productId: string, size: ProductSize | ShoeSize, instagramUsername: string) => {
    const product = products.find(p => p.id === productId);
    
    if (!product || !product.sizes[size] || product.sizes[size] <= 0) {
      console.error('Invalid order: Product not found or out of stock');
      return;
    }

    setProducts(products.map(p => {
      if (p.id === productId) {
        const newStock = p.sizes[size] - 1;
        if (newStock < 0) return p;
        
        return {
          ...p,
          sizes: {
            ...p.sizes,
            [size]: newStock
          }
        };
      }
      return p;
    }));

    setOrders([...orders, {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      instagramUsername,
      size,
      timestamp: Date.now(),
    }]);
  };

  const getStockForSize = (productId: string, size: ProductSize | ShoeSize) => {
    const product = products.find(p => p.id === productId);
    return product ? product.sizes[size] : 0;
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
    };
    
    // Add new product at the beginning of the array
    setProducts([newProduct, ...products]);
  };

  const editProduct = (productId: string, updatedProduct: Omit<Product, 'id' | 'createdAt'>) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...updatedProduct, id: productId, createdAt: product.createdAt }
        : product
    ));
  };

  const deleteProduct = (productId: string) => {
    setProducts(products.filter(product => product.id !== productId));
  };

  return (
    <StoreContext.Provider value={{ 
      products, 
      orders, 
      siteName,
      logoUrl,
      setSiteName,
      setLogoUrl,
      placeOrder, 
      getStockForSize,
      addProduct,
      editProduct,
      deleteProduct
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}