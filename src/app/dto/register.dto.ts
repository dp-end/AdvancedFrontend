// src/app/dto/register.dto.ts

/**
 * Yeni kullanıcı kaydı için frontend'den backend'e gönderilecek veri yapısı.
 */
export interface RegisterDto {
  /** Kullanıcının adı. */
  firstName?: string | null;

  /** Kullanıcının soyadı. */
  lastName?: string | null;

  /** Kullanıcının e-posta adresi. */
  email?: string | null;

  /** Kullanıcının belirlediği şifre. */
  password?: string | null;

  /**
   * Kullanıcının satıcı olarak da kaydolmak isteyip istemediğini belirtir.
   * Bu alan backend'deki RegisterDto ile eşleşmelidir.
   * Opsiyoneldir, frontend'den gönderilmezse backend'de null veya varsayılan değer olarak ele alınabilir.
   */
  registerAsSeller?: boolean | null; // YENİ EKLENDİ
}
