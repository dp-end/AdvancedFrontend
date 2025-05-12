import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngFor, *ngIf, date pipe için
import { Subscription, of, finalize, catchError, Observable } from 'rxjs'; // Gerekli RxJS importları
import { ApiService } from '../../services/api.service'; // ApiService import (Yolu kontrol et)
// ContactMessage arayüzünü model dosyasından import et
import { ContactMessage } from '../../models/contact-message.model'; // Model dosyasından import et

@Component({
  selector: 'app-manage-messages',
  standalone: true,
  // CommonModule importu *ngFor, *ngIf, date pipe için gerekli
  imports: [CommonModule],
  templateUrl: './manage-messages.component.html',
  // Ortak admin tablo stilini veya kendi SCSS dosyasını kullan
  styleUrls: ['./manage-messages.component.scss'] // Ortak stil yolunu kontrol et
})
export class ManageMessagesComponent implements OnInit, OnDestroy {

  messages: ContactMessage[] = []; // Mesajları tutacak dizi
  isLoading = true; // Yüklenme durumu flag'i
  error: string | null = null; // Hata mesajı için
  private messagesSubscription: Subscription | null = null; // Mesajları çekme aboneliği

  // Seçili mesajı tutmak için (detay modalı için)
  selectedMessage: ContactMessage | null = null;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadMessages(); // Component yüklendiğinde mesajları yükle
  }

  ngOnDestroy(): void {
    // Component yok edildiğinde aboneliği sonlandır (hafıza sızıntısını önle)
    this.messagesSubscription?.unsubscribe();
  }

  /**
   * Backend'den tüm iletişim mesajlarını çeker ve listeyi günceller.
   */
  loadMessages(): void {
    this.isLoading = true; // Yükleme başladı
    this.error = null;     // Eski hatayı temizle
    this.messagesSubscription?.unsubscribe(); // Önceki yükleme aboneliğini iptal et

    this.messagesSubscription = this.apiService.getAllMessages() // ApiService'teki metodu çağır
      .pipe(
        finalize(() => {
            this.isLoading = false; // İstek tamamlandığında (başarılı veya hatalı) yüklemeyi bitir
            console.log("İletişim mesajı yükleme işlemi tamamlandı.");
        })
        // catchError burada da eklenebilir veya ApiService'teki yeterli olabilir
        // catchError(err => { ... ; return of([]); })
      )
      .subscribe({
        next: (data) => {
          this.messages = data; // Gelen veriyi component'in messages dizisine ata
          console.log("İletişim mesajları yüklendi:", this.messages);
        },
        error: (err) => { // ApiService'ten gelen Error nesnesi
          console.error("İletişim mesajları yüklenirken hata:", err);
          this.error = err.message || "Mesajlar yüklenirken bir hata oluştu."; // Hata mesajını sakla
          this.messages = []; // Hata durumunda listeyi boşalt
        }
    });
  }

  /**
   * Seçili mesajı detay görünümü için ayarlar.
   * @param message Gösterilecek mesaj nesnesi.
   */
  viewMessageDetail(message: ContactMessage): void {
      console.log("Mesaj detayı görüntüleniyor:", message.id);
      this.selectedMessage = message;
      // TODO: Mesaj durumunu 'READ' olarak güncellemek için API çağrısı yapılabilir
      // Örneğin:
      // if (message.status === 'NEW') {
      //    this.apiService.updateMessageStatus(message.id, 'READ').subscribe(updatedMsg => {
      //       message.status = updatedMsg.status; // Lokal veriyi güncelle
      //    });
      // }
  }

  /**
   * Detay görünümünü (modalı) kapatır.
   */
  closeMessageDetail(): void {
      this.selectedMessage = null;
  }

  /**
   * Mesajı silmek için API çağrısı yapar (Placeholder).
   * @param messageId Silinecek mesajın ID'si.
   */
  deleteMessage(messageId: number | string | undefined): void {
      if (!messageId) return;
      if (confirm(`ID ${messageId} olan mesajı kalıcı olarak silmek istediğinizden emin misiniz?`)) {
          console.log(`Mesaj ${messageId} siliniyor (backend entegrasyonu gerekli)...`);
          // TODO: Backend'e silme isteği gönder
          // this.apiService.delete(`admin/messages/${messageId}`).subscribe({
          //     next: () => {
          //         alert('Mesaj başarıyla silindi.');
          //         this.loadMessages(); // Listeyi yenile
          //     },
          //     error: (err) => alert(`Mesaj silinirken hata: ${err.message}`)
          // });
      }
  }

}
