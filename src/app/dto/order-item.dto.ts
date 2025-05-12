// src/app/dto/order-item.dto.ts

// Product arayüzünüzün de projenizde tanımlı olduğunu varsayıyoruz.
// Gerekirse import { Product } from '../models/product.model';

export interface OrderItemDto {
  id?: number; // OrderItem'ın kendi ID'si
  productId: number;
  productName?: string;
  productImageUrl?: string; // İsteğe bağlı
  quantity: number;
  price: number; // Sipariş anındaki birim fiyat
  // totalPrice?: number; // İsteğe bağlı: quantity * price
}
