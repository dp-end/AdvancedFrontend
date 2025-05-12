// src/app/models/user.model.ts

/**
 * Kullanıcı verisinin yapısını tanımlayan arayüz.
 * Backend'deki User entity'si veya UserDto ile uyumlu olmalıdır.
 */


export interface User {
  /** Kullanıcının benzersiz ID'si (opsiyonel, backend'den gelebilir). */
  id: number | string; // Backend Long kullandığı için number daha uygun olabilir

  /** Kullanıcının e-posta adresi (genellikle zorunlu). */
  email: string;

  /** Kullanıcının adı (opsiyonel). */
  firstName: string;

  /** Kullanıcının soyadı (opsiyonel). */
  lastName: string;

  /** Kullanıcının sahip olduğu rollerin listesi (zorunlu). */
  roles: string[]; // Örn: ['ROLE_USER', 'ROLE_ADMIN']

  /** Kullanıcının aktif/pasif durumu (opsiyonel ama admin paneli için gerekli). */
  enabled: boolean;
}
