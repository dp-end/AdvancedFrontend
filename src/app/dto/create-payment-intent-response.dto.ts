// src/app/dto/create-payment-intent-response.dto.ts

/**
 * Backend'den Stripe Payment Intent'in clientSecret'ını
 * frontend'e döndürmek için kullanılan DTO arayüzü.
 */
export interface CreatePaymentIntentResponseDto { // <-- İSİM DÜZELTİLDİ
  /**
   * Frontend'in Stripe.js ile ödemeyi onaylamak için kullanacağı gizli anahtar.
   */
  clientSecret: string;
}
