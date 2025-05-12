// src/app/guards/admin.guard.ts (Yeni dosya)

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    if (this.authService.isLoggedIn() && this.authService.isAdmin()) {
      // Kullanıcı giriş yapmış VE admin ise izin ver
      return true;
    } else if (this.authService.isLoggedIn()) {
      // Kullanıcı giriş yapmış AMA admin değilse, yetkisiz sayfasına yönlendir (veya ana sayfaya)
      console.warn('AdminGuard: Yetkisiz erişim denemesi!');
      return this.router.createUrlTree(['/']); // Veya '/unauthorized' gibi bir sayfaya
    } else {
      // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
      console.log('AdminGuard: Kullanıcı giriş yapmamış, yönlendiriliyor...');
      return this.router.createUrlTree(['/'], { queryParams: { message: 'Bu sayfaya erişim için admin olarak giriş yapmalısınız.' } }); // Ana sayfaya mesajla yönlendir
    }
  }
}
