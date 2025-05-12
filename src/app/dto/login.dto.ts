        // src/app/dto/login.dto.ts

        /**
         * Kullanıcı girişi için frontend'den backend'e gönderilecek veri yapısı.
         */
        export interface LoginDto {
          /** Kullanıcının e-posta adresi (veya kullanıcı adı). */
          email?: string | null;

          /** Kullanıcının şifresi. */
          password?: string | null;
        }
