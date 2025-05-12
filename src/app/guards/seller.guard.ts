// src/app/guards/seller.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service'; // AuthService'inizin doğru yolunu belirtin

export const sellerGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Kullanıcı giriş yapmış, şimdi satıcı rolüne sahip mi diye kontrol et
    if (authService.isSeller()) {
      return true; // Kullanıcı giriş yapmış ve satıcı ise erişime izin ver
    } else {
      // Kullanıcı giriş yapmış ama satıcı değilse, yetkisiz erişim sayfasına veya ana sayfaya yönlendir
      console.warn('SellerGuard: Kullanıcı satıcı değil, erişim engellendi. Yönlendiriliyor...');
      router.navigate(['/urunler']); // Veya '/yetkisiz-erisim' gibi bir sayfa
      return false;
    }
  } else {
    // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
    console.warn('SellerGuard: Kullanıcı giriş yapmamış, erişim engellendi. Login sayfasına yönlendiriliyor...');
    // Login sayfasına yönlendirirken, başarılı giriş sonrası gidilmek istenen URL'yi (state.url)
    // query parametresi olarak gönderebilirsiniz. Login component'i bu parametreyi alıp
    // başarılı giriş sonrası kullanıcıyı o URL'ye yönlendirebilir.
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};
