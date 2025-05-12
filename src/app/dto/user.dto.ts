// src/app/dto/user.dto.ts

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  roles: string[]; // Backend'den gelen rollerin string listesi olduğunu varsayıyoruz
  // Backend UserDto'nuzda bulunan diğer alanlar
}
