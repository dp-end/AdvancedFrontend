import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // Gerekli router modülleri
import { AuthService } from '../../services/auth.service'; // AuthService import (doğru yolu kontrol et)

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive], // Importları ekle
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'] // SCSS dosyasını oluşturman gerekecek
})
export class AdminLayoutComponent {

  constructor(private authService: AuthService) {} // AuthService'i enjekte et

  logout(): void {
    this.authService.logout(); // AuthService'teki logout metodunu çağır
    // Yönlendirme zaten AuthService içinde yapılıyor
  }
}
