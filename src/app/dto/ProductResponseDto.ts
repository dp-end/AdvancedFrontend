// src/app/dto/product-response.dto.ts (veya projenizdeki doğru yolda)

// SellerInfoResponseDto'nun aynı 'dto' klasöründe olduğunu varsayıyoruz.
// Eğer farklı bir yoldaysa (örn: ../models/seller-info.dto), yolu ona göre güncelleyin.
import { SellerInfoResponseDto } from './SellerInfoResponseDto';

/**
 * API'den ürün bilgileri için dönen yanıtı temsil eden arayüz.
 * Backend'deki ProductResponseDto.java ile uyumlu olmalıdır.
 */
export interface ProductResponseDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string | null;
  category: string | null;
  type?: string | null;
  active: boolean;
  stockQuantity: number; // Bu alan önemli
  seller?: SellerInfoResponseDto | null;
}
