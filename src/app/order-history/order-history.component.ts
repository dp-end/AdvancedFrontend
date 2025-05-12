import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Observable, of, Subscription, finalize, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse import edildi
import { User } from '../models/user.model'; // User modeli, eğer kullanılıyorsa
import { Order, OrderItem } from '../models/order.model'; // Order ve OrderItem modelleri

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss']
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  orders$: Observable<Order[]>; // Observable<Order[]> olarak kalabilir
  // Veya doğrudan bir dizi olarak tutmak isterseniz:
  // orders: Order[] = [];
  isLoading = true;
  error: string | null = null;
  private ordersSubscription: Subscription | null = null;

  constructor(private apiService: ApiService) {
    this.orders$ = of([]); // Başlangıçta boş bir Order dizisi observable'ı
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    this.ordersSubscription?.unsubscribe();

    // ApiService'teki public 'get' metodu kullanılıyor.
    // Backend'den dönen yanıtın Order[] ile uyumlu olduğunu varsayıyoruz.
    // Eğer backend OrderDto[] döndürüyorsa ve Order ile OrderDto arasında farklar varsa,
    // ApiService içinde bir map'leme yapılabilir veya burada OrderDto[] beklenir.
    this.ordersSubscription = this.apiService.get<Order[]>('orders/my-orders')
      .pipe(
        finalize(() => {
          this.isLoading = false;
          console.log("Sipariş yükleme işlemi tamamlandı (finalize).");
        }),
        catchError((err: HttpErrorResponse) => { // err tipi HttpErrorResponse olarak güncellendi
          console.error("Siparişler yüklenirken hata (catchError içi):", err);
          this.error = err.message || "Siparişler yüklenirken bir hata oluştu.";
          // Hata durumunda orders$'ı boş bir dizi observable'ına ayarlayarak template'in kırılmasını önle
          this.orders$ = of([]);
          return of([]); // Hata yakalandıktan sonra boş bir dizi observable'ı döndür
        })
      )
      .subscribe({
        next: (data: Order[]) => { // data tipi Order[] olarak güncellendi
          this.orders$ = of(data); // Gelen veriyi observable olarak ata
          console.log("Siparişler yüklendi:", data);
          if (data.length === 0) {
            console.log("Gösterilecek sipariş bulunmuyor.");
          }
        },
        error: (err: HttpErrorResponse) => { // err tipi HttpErrorResponse olarak güncellendi
          // catchError bloğu zaten hatayı yakalayıp of([]) döndürdüğü için
          // bu error bloğu normalde çağrılmaz, ama bir güvenlik önlemi olarak kalabilir.
          console.error("Siparişler yüklenirken subscribe error bloğu:", err);
          this.error = err.message || "Siparişler yüklenirken beklenmedik bir hata oluştu.";
          this.orders$ = of([]); // Hata durumunda listeyi boşalt
        }
    });
  }

  // Sipariş durumuna göre CSS sınıfı döndüren yardımcı metot
  getStatusClass(status: string | undefined | null): string {
    const statusLower = status?.toLowerCase() || '';
    switch(statusLower) {
      case 'kargoda':
      case 'shipping': // İngilizce karşılıkları da eklenebilir
        return 'status-shipping';
      case 'teslim edildi':
      case 'delivered':
        return 'status-delivered';
      case 'hazırlanıyor':
      case 'processing':
      case 'pending': // 'pending' de 'processing' gibi görünebilir
        return 'status-processing';
      case 'iptal edildi':
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  // Verilen status string'ini CSS sınıfı için formatlar
  formatRefundClass(status?: string | null): string {
    if (!status) {
      return '';
    }
    const formatted = status.toLowerCase().replace(/\s+/g, '-');
    return `refund-${formatted}`;
  }

  // İsteğe bağlı: Sipariş detayına gitme fonksiyonu
  // Order modelinizdeki id tipine göre (number | string) güncelleyin
  viewOrderDetail(orderId: number | string | undefined): void {
    if (orderId === undefined) {
        console.warn("Sipariş detayı için ID tanımsız.");
        return;
    }
    console.log("Sipariş detayı görüntüleniyor:", orderId);
    // this.router.navigate(['/siparis-detay', orderId]); // Örnek yönlendirme
  }

  ngOnDestroy(): void {
    this.ordersSubscription?.unsubscribe();
  }
}
