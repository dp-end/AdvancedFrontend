import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'; // [(ngModel)] için FormsModule eklendi
import { Subscription } from 'rxjs';

// Modellerinizi ve servislerinizi doğru yollardan import edin
import { OrderDto } from '../dto/order.dto'; // DTO klasörünüzdeki OrderDto'yu import edin
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse import edildi

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, FormsModule], // FormsModule eklendi
  templateUrl: './seller-order.component.html',
  styleUrls: ['./seller-order.component.scss']
})
export class SellerOrdersComponent implements OnInit, OnDestroy {
  sellerOrders: OrderDto[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  selectedStatusFilter: string = '';

  private ordersSubscription: Subscription | undefined;
  private updateStatusSubscription: Subscription | undefined;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSellerOrders();
  }

  loadSellerOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.ordersSubscription = this.apiService.getSellerOrders(this.selectedStatusFilter || undefined).subscribe({
      next: (orders: OrderDto[]) => { // 'orders' parametresine OrderDto[] tipi eklendi
        this.sellerOrders = orders;
        this.isLoading = false;
        if (orders.length === 0 && !this.selectedStatusFilter) {
          // this.errorMessage = "Henüz hiç siparişiniz bulunmamaktadır.";
        } else if (orders.length === 0 && this.selectedStatusFilter) {
          // this.errorMessage = `"${this.selectedStatusFilter}" durumunda sipariş bulunmamaktadır.`;
        }
      },
      error: (err: Error | HttpErrorResponse) => { // 'err' parametresine daha spesifik tipler eklendi
        this.errorMessage = err.message || 'Siparişler yüklenirken bir hata oluştu.';
        this.isLoading = false;
        console.error('Satıcı siparişleri yüklenirken hata:', err);
      }
    });
  }

  onStatusFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedStatusFilter = selectElement.value;
    this.loadSellerOrders();
  }

  navigateToOrderDetails(orderId: number | string | undefined): void {
    if (orderId === undefined) return;
    alert(`Sipariş ID ${orderId} için detay sayfasına gidilecek (henüz implemente edilmedi).`);
    // this.router.navigate(['/seller/orders/details', orderId]); // Gelecekteki detay sayfası
  }

  openUpdateStatusModal(order: OrderDto): void {
    const newStatus = prompt(`Sipariş #${order.id} için yeni durum girin (örn: SHIPPED, PROCESSING):`, order.status);
    if (newStatus && newStatus.trim() !== '' && newStatus.toUpperCase() !== order.status?.toUpperCase()) {

      this.updateStatusSubscription?.unsubscribe();

      // order.id'nin number olduğundan emin olalım (ApiService number bekliyor)
      const orderIdAsNumber = Number(order.id);
      if (isNaN(orderIdAsNumber)) {
        alert('Geçersiz sipariş IDsi.');
        console.error('Geçersiz sipariş IDsi:', order.id);
        return;
      }

      this.updateStatusSubscription = this.apiService.updateSellerOrderStatus(orderIdAsNumber, newStatus.toUpperCase()).subscribe({
        next: (updatedOrder: OrderDto) => { // 'updatedOrder' parametresine OrderDto tipi eklendi
          alert(`Sipariş #${updatedOrder.id} durumu "${updatedOrder.status}" olarak güncellendi.`);
          this.loadSellerOrders();
        },
        error: (err: Error | HttpErrorResponse) => { // 'err' parametresine daha spesifik tipler eklendi
          alert(`Sipariş durumu güncellenirken hata: ${err.message}`);
          console.error('Sipariş durumu güncelleme hatası:', err);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.ordersSubscription?.unsubscribe();
    this.updateStatusSubscription?.unsubscribe();
  }
}
