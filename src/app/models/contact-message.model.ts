// src/app/models/contact-message.model.ts

/**
 * İletişim formu mesajlarının yapısını tanımlayan arayüz.
 * Backend'deki ContactMessage entity'si ile uyumlu olmalıdır.
 */
export interface ContactMessage {
  /** Mesajın benzersiz ID'si (backend'den gelir). */
  id?: number | string; // Backend Long kullandığı için number daha uygun olabilir

  /** Mesajı gönderenin adı. */
  name: string;

  /** Mesajı gönderenin e-posta adresi. */
  email: string;

  /** Gönderilen mesajın içeriği. */
  message: string;

  /** Mesajın backend'e ulaştığı tarih ve saat. */
  receivedAt: Date | string; // Backend genellikle string formatında gönderir

  /** Mesajın durumu (opsiyonel, backend'de tanımlandıysa). */
  status?: 'NEW' | 'READ' | 'REPLIED' | string; // Örnek durumlar
}
