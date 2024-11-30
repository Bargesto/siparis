import { useState } from 'react';
import { Product, ProductSize, ShoeSize } from '../types';
import { useStore } from '../contexts/StoreContext';
import { clsx } from 'clsx';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { placeOrder, getStockForSize } = useStore();
  const [selectedSize, setSelectedSize] = useState<ProductSize | ShoeSize | null>(null);
  const [instagramUsername, setInstagramUsername] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const sizes = Object.entries(product.sizes).filter(([_, stock]) => stock >= 0);
  
  const currentStock = selectedSize ? getStockForSize(product.id, selectedSize) : 0;
  const isOutOfStock = selectedSize ? currentStock <= 0 : true;

  const handleOrder = () => {
    if (!selectedSize || !instagramUsername || isOutOfStock) return;
    
    placeOrder(product.id, selectedSize, instagramUsername);
    setShowSuccess(true);
    setInstagramUsername('');
    setSelectedSize(null);
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-64 object-cover"
      />
      
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <span className="text-lg font-bold text-blue-600">{product.price.toFixed(2)} TL</span>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {sizes.map(([size, stock]) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size as ProductSize | ShoeSize)}
              className={clsx(
                "px-3 py-1 rounded border",
                selectedSize === size
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-gray-300 hover:border-blue-500",
                stock === 0 && "opacity-50 cursor-not-allowed bg-gray-100"
              )}
              disabled={stock === 0}
            >
              {size}
              <span className="ml-1 text-sm">
                ({stock})
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <input
            type="text"
            placeholder="Instagram kullanıcı adı"
            value={instagramUsername}
            onChange={(e) => setInstagramUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <button
          onClick={handleOrder}
          disabled={!selectedSize || !instagramUsername || isOutOfStock}
          className={clsx(
            "mt-4 w-full py-2 px-4 rounded",
            selectedSize && instagramUsername && !isOutOfStock
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 cursor-not-allowed"
          )}
        >
          {isOutOfStock && selectedSize ? 'Stokta Yok' : 'Sipariş Ver'}
        </button>

        {showSuccess && (
          <div className="mt-2 text-center text-green-600">
            Siparişiniz başarıyla alındı!
          </div>
        )}
      </div>
    </div>
  );
}