// src/app/dto/order.dto.ts

import { OrderItemDto } from './order-item.dto';
import { UserDto } from './user.dto'; // UserDto'nuzun da olması gerekir
import { AddressDto } from './address.dto'; // AddressDto'nuzun da olması gerekir

export interface OrderDto {
  id?: number;
  orderDate: string | Date;
  totalAmount: number;
  status?: string;
  shippingAddress?: AddressDto;
  paymentMethod?: string;

  /**
   * Kargo takip numarası.
   * Opsiyoneldir ve string veya undefined olabilir.
   * 'null' değeri kaldırıldı.
   */
  trackingNumber?: string; // Artık string | undefined

  user?: UserDto;
  items?: OrderItemDto[];
  cancellationReason?: string | null; // null kalabilir, backend'den null gelebilir
  refundStatus?: string | null; // null kalabilir, backend'den null gelebilir
}
