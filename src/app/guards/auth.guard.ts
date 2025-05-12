import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if (this.authService.isLoggedIn()) {
      // Kullanıcı giriş yapmış, izin ver
      return true;
    } else {
      // Kullanıcı giriş yapmamış, login sayfasına yönlendir (veya ana sayfaya)
      console.log('AuthGuard: Kullanıcı giriş yapmamış, yönlendiriliyor...');
      // Yönlendirme sonrası gidilmek istenen sayfayı query param olarak ekleyebiliriz
      return this.router.createUrlTree(['/'], { queryParams: { returnUrl: state.url } });
      // Veya doğrudan ana sayfaya atabilir: return this.router.createUrlTree(['/']);
    }
  }
}
