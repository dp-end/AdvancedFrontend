// src/app/models/seller-info.dto.ts (veya uygun bir yolda)

/**
 * API'den dönen satıcı bilgilerini temsil eden arayüz.
 */
export interface SellerInfoResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  // İsteğe bağlı olarak backend DTO'sunda olan diğer alanlar eklenebilir
  // Örneğin: displayName?: string;
}
