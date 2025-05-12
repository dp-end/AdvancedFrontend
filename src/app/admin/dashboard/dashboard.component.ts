import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngIf için
// Importları düzelt:
import { ApiService } from '../../services/api.service'; // ApiService importu doğru
import { AdminDashboardStats } from '../../models/admin-stats.model'; // <-- YOL GÜNCELLENDİ: Modelden import
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators'; // finalize importu (opsiyonel)

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  // Ortak admin tablo stilini veya kendi SCSS dosyasını kullan
  styleUrls: ['./dashboard.component.scss'] // Ortak stil yolunu kontrol et
})
export class DashboardComponent implements OnInit {

  stats: AdminDashboardStats | null = null; // İstatistikleri tutacak değişken (Tip modelden geliyor)
  isLoading = true; // Yüklenme durumu
  error: string | null = null; // Hata mesajı

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadStats(); // Component yüklendiğinde istatistikleri yükle
  }

  /**
   * Backend'den gösterge paneli istatistiklerini çeker.
   */
  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    this.apiService.getAdminDashboardStats() // ApiService'teki metodu çağır
      .pipe(
        finalize(() => { // Yüklenme durumunu her zaman false yap
            this.isLoading = false;
            console.log("İstatistik yükleme işlemi tamamlandı (finalize).");
        }),
        catchError(err => { // Hata durumunu yakala
          console.error("Dashboard istatistikleri yüklenirken hata:", err);
          this.error = err.message || "İstatistikler yüklenirken bir hata oluştu.";
          return of(null); // Hata durumunda null döndür
        })
      )
      .subscribe(data => {
        if (data) {
          this.stats = data; // Gelen veriyi stats değişkenine ata
          console.log("Dashboard istatistikleri yüklendi:", this.stats);
        }
        // isLoading = false; // finalize bloğuna taşındı
      });
  }
}
