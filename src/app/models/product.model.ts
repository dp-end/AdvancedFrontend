// src/app/models/product.model.ts (Örnek Güncelleme)
export interface Product {
  id?: number | null; // Backend'e gönderirken null olabilir, backend'den number gelir
  name: string;
  description?: string;
  price: number | null;
  category: string | null; // Kategori adı, string ve null olabilir
  type?: string | null;
  imageUrl?: string | null;
  stockQuantity: number; // Bu alan ProductResponseDto ile tutarlı olmalı
  active: boolean;
  // sellerId?: number; // Backend'e gönderirken belki sadece ID
}
