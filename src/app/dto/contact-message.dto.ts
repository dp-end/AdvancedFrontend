// src/app/dto/contact-message.dto.ts

/**
 * Standart iletişim formundan backend'e gönderilecek
 * mesaj bilgilerinin yapısını tanımlayan arayüz (DTO).
 */
export interface ContactMessageDto {
  /** Mesajı gönderenin adı. */
  name: string;

  /** Mesajı gönderenin e-posta adresi. */
  email: string;

  /** Gönderilen mesajın içeriği. */
  message: string;
}
