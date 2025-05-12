// src/app/models/admin-stats.model.ts

/**
 * Admin gösterge paneli istatistiklerinin yapısını tanımlayan arayüz.
 */
export interface AdminDashboardStats {
  /** Toplam ürün sayısı (opsiyonel). */
  totalProducts?: number;

  /** Bekleyen sipariş sayısı (opsiyonel). */
  pendingOrders?: number;

  /** Toplam kayıtlı kullanıcı sayısı (opsiyonel). */
  totalUsers?: number;

  // Buraya başka istatistikler eklenebilir (örn: toplam gelir vb.)
}
