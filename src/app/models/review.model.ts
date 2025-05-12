// src/app/models/review.model.ts

/**
 * Ürün yorumu verisinin yapısını tanımlayan arayüz.
 * Backend'deki Review entity'si veya ReviewDto ile uyumlu olmalıdır.
 */
export interface Review {
  /** Yorumun ID'si (opsiyonel, backend'den gelebilir). */
  id?: number | string; // Backend Long kullandığı için number daha uygun olabilir

  /** Yorumun ait olduğu ürünün ID'si (zorunlu). */
  productId: number | string;

  /** Yorumu yapan kullanıcının ID'si (opsiyonel). */
  userId?: number | string;

  /** Yorumu yapan kullanıcının adı (zorunlu). */
  userName: string; // Backend bu bilgiyi atayabilir

  /** Verilen puan (zorunlu). */
  rating: number; // 1-5 arası

  /** Yorum metni (zorunlu). */
  comment: string;

  /** Yorumun yapıldığı tarih (zorunlu). */
  reviewDate: Date | string; // Backend genellikle string formatında gönderir
}
