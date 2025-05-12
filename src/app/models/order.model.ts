// src/app/models/order.model.ts
import { User } from './user.model';

/**
 * Teslimat adresi bilgilerini temsil eden arayüz.
 */
export interface ShippingAddress { // Veya genel bir Address arayüzü de kullanabilirsiniz
  fullName?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

/**
 * Bir sipariş içindeki tek bir ürün kalemini temsil eden arayüz.
 */
export interface OrderItem {
  productId: string | number; // ProductResponseDto.id number olduğu için number tercih edilebilir
  productName: string;
  quantity: number;
  price: number; // Sipariş anındaki fiyat
  id?: number; // OrderItemDto'dan geliyorsa
  // imageUrl?: string; // Eğer sepet veya sipariş listesinde resim gösterilecekse
}

/**
 * Sipariş verisinin yapısını tanımlayan arayüz.
 */
export interface Order {
  id: number; // API'den number geldiğini varsayarak güncelledik
  orderDate: Date; // String yerine Date olarak işlemek genellikle daha iyidir
  totalAmount: number;
  status: string;
  user?: User; // User modeliniz
  trackingNumber?: string;
  items?: OrderItem[];

  // Düz alanlar yerine ShippingAddress nesnesi kullanıldı
  shippingAddress?: ShippingAddress;

  paymentMethod?: string; // OrderDto'dan eklendi
  cancellationReason?: string; // OrderDto'dan cancellationReason (null olabilir)
  refundStatus?: 'İade Edildi' | 'İade İşlemde' | 'İade Yok' | string | null; // OrderDto'dan refundStatus (null olabilir)
}
