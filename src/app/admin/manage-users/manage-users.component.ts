import { Component, OnInit, OnDestroy } from '@angular/core'; // OnDestroy eklendi
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, of, Subscription, finalize, catchError } from 'rxjs'; // Gerekli RxJS importları
import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse import edildi
import { ApiService } from '../../services/api.service'; // Yolunu kontrol et
import { User } from '../../models/user.model'; // Modelden import

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit, OnDestroy {

  users: User[] = [];
  isLoading = true;
  error: string | null = null;
  private usersSubscription: Subscription | null = null;
  private statusUpdateSubscription: Subscription | null = null;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.usersSubscription?.unsubscribe();
    this.statusUpdateSubscription?.unsubscribe();
  }

  /**
   * Backend'den tüm kullanıcıları çeker ve listeyi günceller.
   */
  loadUsers(): void {
    this.isLoading = true;
    this.error = null;
    this.usersSubscription?.unsubscribe();

    this.usersSubscription = this.apiService.getAllUsersForAdmin()
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data: User[]) => { // data parametresine User[] tipi eklendi
          this.users = data;
          console.log("Kullanıcılar yüklendi:", this.users);
          if (data.length === 0) {
            console.log("Gösterilecek kullanıcı bulunmuyor.");
          }
        },
        error: (err: HttpErrorResponse) => { // err parametresine HttpErrorResponse tipi eklendi
          console.error("Admin için kullanıcılar yüklenirken hata:", err);
          this.error = err.message || "Kullanıcılar yüklenirken bir hata oluştu.";
          this.users = [];
        }
      });
  }

  /**
   * Kullanıcının aktif/pasif durumunu backend'e göndererek günceller.
   * @param user Durumu değiştirilecek kullanıcı nesnesi.
   */
  toggleUserStatus(user: User): void {
    // user.id'nin undefined, null veya boş string olup olmadığını kontrol et
    if (user.id === undefined || user.id === null || user.id === '') {
      console.error("Kullanıcı ID'si bulunamadı veya geçersiz, durum güncellenemiyor.");
      this.error = "Kullanıcı ID'si geçersiz, durum güncellenemiyor.";
      return;
    }

    // user.id'yi number tipine çevir
    const numericUserId = Number(user.id);
    if (isNaN(numericUserId)) {
        console.error(`Kullanıcı ID'si ('${user.id}') geçerli bir sayıya dönüştürülemedi.`);
        this.error = `Kullanıcı ID'si ('${user.id}') geçersiz.`;
        return;
    }

    const currentStatus = user.enabled ?? true; // null/undefined ise true varsay
    const newStatus = !currentStatus;
    const actionText = newStatus ? 'aktif' : 'pasif';

    if (confirm(`${user.email} email adresli kullanıcıyı ${actionText} yapmak istediğinizden emin misiniz?`)) {
      this.statusUpdateSubscription?.unsubscribe();
      this.isLoading = true; // Durum güncelleme sırasında yüklenme durumu

      this.statusUpdateSubscription = this.apiService.updateUserStatus(numericUserId, newStatus) // numericUserId kullanıldı
        .pipe(finalize(() => {
          this.isLoading = false; // İşlem tamamlandığında yüklenmeyi bitir
          console.log(`Kullanıcı ${numericUserId} için durum güncelleme API çağrısı tamamlandı.`);
        }))
        .subscribe({
          next: (updatedUser: User) => { // updatedUser parametresine User tipi eklendi
            alert(`Kullanıcı başarıyla ${actionText} yapıldı.`);
            const index = this.users.findIndex(u => u.id === updatedUser.id);
            if (index !== -1) {
              this.users[index] = updatedUser;
            } else {
              this.loadUsers(); // Beklenmedik durum, listeyi yeniden yükle
            }
          },
          error: (err: HttpErrorResponse) => { // err parametresine HttpErrorResponse tipi eklendi
            console.error(`Kullanıcı (ID: ${numericUserId}) durumu güncellenirken hata:`, err);
            this.error = err.message || `Kullanıcı durumu güncellenirken bir hata oluştu.`;
            alert(this.error);
          }
        });
    }
  }
}
