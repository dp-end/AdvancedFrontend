        // src/app/dto/jwt-auth-response.dto.ts

        /**
         * Başarılı giriş sonrası backend'den frontend'e döndürülecek JWT yanıtının yapısı.
         */
        export interface JwtAuthResponseDto {
          /** Erişim token'ı (JWT). */
          accessToken: string;

          /** Token tipi (Genellikle 'Bearer'). */
          tokenType?: string;

          // Backend yanıtta ek bilgi gönderiyorsa buraya eklenebilir (örn: roller)
          // roles?: string[];
        }
