// src/app/dto/address.dto.ts

export interface AddressDto {
  id?: number; // Eğer adreslerin ID'si varsa
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string | null; // Opsiyonel olabilir
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  // Backend AddressDto'nuzda bulunan diğer alanlar
}
