export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | '4XL' | '5XL' | '6XL';
export type ShoeSize = '36' | '37' | '38' | '39' | '40' | '41' | '42' | '43' | '44' | '45';

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  type: 'clothing' | 'shoes';
  sizes: Record<ProductSize | ShoeSize, number>; // size to stock mapping
  createdAt: number; // timestamp when the product was added
}

export interface Order {
  id: string;
  productId: string;
  instagramUsername: string;
  size: ProductSize | ShoeSize;
  timestamp: number;
}