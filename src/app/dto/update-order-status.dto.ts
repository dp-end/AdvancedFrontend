// src/app/dto/update-order-status.dto.ts

/**
 * Admin tarafından sipariş durumunu güncelleme isteği için
 * frontend'den backend'e gönderilecek veri yapısı.
 */
export interface UpdateOrderStatusDto {
  /**
   * Siparişin atanacağı yeni durum (örn: "SHIPPED", "DELIVERED").
   * Backend'deki beklenen durum değerleriyle eşleşmelidir.
   */
  newStatus: string;

  /**
   * Kargo takip numarası (opsiyonel, genellikle durum "SHIPPED" yapıldığında eklenir).
   */
  trackingNumber?: string;
}
