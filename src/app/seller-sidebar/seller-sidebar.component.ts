// src/app/seller-admin/seller-sidebar/seller-sidebar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router'; // Router, RouterLink ve RouterLinkActive import edildi
import { AuthService } from '../services/auth.service'; // AuthService'inizin doğru yolunu belirtin
// Material Icons modülünü veya ikonları kullanmak için gerekli importlar
// Eğer Angular Material kullanıyorsanız: import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-seller-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, // RouterLink eklendi
    RouterLinkActive // RouterLinkActive eklendi
    // MatIconModule // Eğer Angular Material ikonları kullanıyorsanız
  ],
  templateUrl: './seller-sidebar.component.html',
  styleUrls: ['./seller-sidebar.component.scss']
})
export class SellerSidebarComponent {

  constructor(
    private authService: AuthService,
    private router: Router // Çıkış sonrası yönlendirme için
  ) {}

  logout(): void {
    this.authService.logout(); // AuthService'teki logout metodunu çağır
    // Çıkış yapıldıktan sonra kullanıcıyı ana sayfaya veya giriş sayfasına yönlendir.
    // Bu yönlendirme AuthService içinde de yapılabilir.
    // this.router.navigate(['/login']);
  }
}
