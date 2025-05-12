// src/app/dto/create-payment-intent-request.dto.ts

/**
 * Frontend'den backend'e Stripe Payment Intent oluşturma isteği
 * gönderilirken kullanılan DTO arayüzü.
 */
export interface CreatePaymentIntentRequestDto {
  /**
   * Ödenecek tutar (kuruş veya en küçük para birimi cinsinden).
   * Frontend'de hesaplanıp gönderilir (örn: totalPrice * 100).
   */
  amount: number; // Backend Long beklese de frontend'de number kullanmak daha yaygındır

  /**
   * Para birimi kodu (ISO 4217 formatında, örn: "try", "usd").
   */
  currency: string;

  // Backend'e başka bilgiler göndermek gerekirse buraya eklenebilir
  // (örn: sipariş ID taslağı, müşteri ID'si vb.)
}
