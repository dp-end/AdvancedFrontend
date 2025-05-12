import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // ChangeDetectorRef eklendi
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil, map, tap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';

// Component'inizin kullandığı Order, OrderItem, ShippingAddress ve User modelleri
import { Order, OrderItem, ShippingAddress } from '../../models/order.model';
import { User } from '../../models/user.model'; // User modelini import ettik

// ApiService'ten dönen DTO'lar
// Bu import yollarının projenizdeki doğru yolları gösterdiğinden emin olun.
import { OrderDto, } from '../../dto/order.dto';
import { OrderItemDto } from '../../dto/order-item.dto'; // OrderItemDto import edildi
import { UpdateOrderStatusDto } from '../../dto/update-order-status.dto';
import { UserDto as OrderUserDto} from '../../dto/user.dto';
import { AddressDto } from '../../dto/address.dto';

@Component({
  selector: 'app-manage-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-orders.component.html',
  styleUrls: ['./manage-orders.component.scss']
})
export class ManageOrdersComponent implements OnInit, OnDestroy {

  orders$: Observable<Order[]>;
  isLoading = true;
  error: string | null = null;

  private destroy$ = new Subject<void>();
  private loadOrdersCallCount = 0; // loadOrders çağrı sayısını takip etmek için

  availableStatuses: string[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef // ChangeDetectorRef enjekte edildi
  ) {
    this.orders$ = of([]);
  }

  ngOnInit(): void {
    console.log("ManageOrdersComponent ngOnInit çağrıldı.");
    this.loadOrders();
  }

  ngOnDestroy(): void {
    console.log("ManageOrdersComponent ngOnDestroy çağrıldı.");
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.loadOrdersCallCount++;
    console.log(`loadOrders çağrıldı. Çağrı Sayısı: ${this.loadOrdersCallCount}. isLoading true olarak ayarlanıyor.`);
    this.isLoading = true;
    this.error = null;
    // this.cdr.detectChanges(); // Değişikliği hemen yansıtmak için (opsiyonel test)

    this.orders$ = this.apiService.getAllOrdersForAdmin().pipe(
      map((orderDtos: OrderDto[]): Order[] => {
        console.log("API'den gelen OrderDto'lar:", orderDtos);
        if (!orderDtos) {
          console.warn("getAllOrdersForAdmin'dan null veya undefined OrderDto dizisi geldi.");
          return [];
        }
        return orderDtos.map((dto: OrderDto): Order => {
          const mappedOrder: Order = {
            id: dto.id!,
            orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
            totalAmount: dto.totalAmount,
            status: dto.status || 'UNKNOWN',
            shippingAddress: this.mapAddressDtoToShippingAddress(dto.shippingAddress),
            paymentMethod: dto.paymentMethod,
            trackingNumber: dto.trackingNumber,
            user: dto.user ? this.mapUserDtoToUserModel(dto.user) : undefined,
            items: dto.items ? dto.items.map(itemDto => this.mapOrderItemDtoToModel(itemDto)) : [],
            cancellationReason: dto.cancellationReason || undefined,
            refundStatus: dto.refundStatus || null,
          };
          return mappedOrder;
        });
      }),
      tap(mappedOrders => {
        console.log("Order modeline map'lenmiş siparişler:", mappedOrders);
        if(mappedOrders.length === 0 && !this.error) {
            console.log("Gösterilecek sipariş bulunmuyor (map sonrası).");
        }
      }),
      catchError((err: HttpErrorResponse) => {
        this.error = err.message || 'Siparişler yüklenirken bir hata oluştu.';
        console.error('Sipariş yükleme hatası (catchError):', err);
        console.log("catchError içinde isLoading false olarak ayarlanıyor.");
        this.isLoading = false;
        // this.cdr.detectChanges(); // Değişikliği hemen yansıtmak için (opsiyonel test)
        return of([]);
      }),
      finalize(() => {
        console.log("Sipariş yükleme işlemi finalize bloğuna girdi. isLoading false olarak ayarlanıyor.");
        this.isLoading = false;
        console.log("Sipariş yükleme işlemi tamamlandı (finalize). isLoading:", this.isLoading);
        // this.cdr.detectChanges(); // Değişikliği hemen yansıtmak için (opsiyonel test)
      }),
      takeUntil(this.destroy$)
    );
  }

  private mapAddressDtoToShippingAddress(dto?: AddressDto): ShippingAddress | undefined {
    if (!dto) {
      return undefined;
    }
    return {
        fullName: dto.fullName,
        addressLine1: dto.addressLine1,
        city: dto.city,
        postalCode: dto.postalCode,
        country: dto.country,
        phone: dto.phone
    };
  }

  private mapUserDtoToUserModel(dto: OrderUserDto): User {
      return {
          id: dto.id!,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roles: dto.roles || [],
          enabled: dto.enabled ?? true,
      };
  }

  private mapOrderItemDtoToModel(dto: OrderItemDto): OrderItem {
      return {
          id: dto.id,
          productId: dto.productId,
          productName: dto.productName || 'Bilinmeyen Ürün',
          quantity: dto.quantity,
          price: dto.price
      };
  }

  getStatusClass(status: string | undefined): string {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'kargoda': case 'shipped': return 'status-shipping';
      case 'teslim edildi': case 'delivered': return 'status-delivered';
      case 'hazırlanıyor': case 'processing': case 'pending': return 'status-processing';
      case 'iptal edildi': case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  formatRefundClass(status?: string | null): string {
    if (!status) return '';
    return `refund-${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  updateOrderStatus(orderId: number | undefined, event: Event): void {
    if (orderId === undefined) {
      this.error = "Sipariş IDsi geçersiz.";
      console.error('Geçersiz sipariş IDsi:', orderId);
      return;
    }

    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value;

    if (!newStatus || !this.availableStatuses.includes(newStatus.toUpperCase())) {
        this.error = "Lütfen geçerli bir durum seçin.";
        alert(this.error);
        return;
    }

    console.log(`Sipariş ${orderId} durumu ${newStatus} olarak güncelleniyor...`);
    this.isLoading = true;

    const statusUpdateDto: UpdateOrderStatusDto = { newStatus: newStatus };

    this.apiService.put<OrderDto>(`admin/orders/${orderId}/status`, statusUpdateDto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
            console.log(`updateOrderStatus (ID: ${orderId}) finalize bloğu. isLoading false olarak ayarlanıyor.`);
            this.isLoading = false;
            // this.cdr.detectChanges(); // Opsiyonel
        })
      )
      .subscribe({
        next: (updatedOrderDto: OrderDto) => {
          alert(`Sipariş ${orderId} başarıyla '${newStatus}' olarak güncellendi.`);
          this.loadOrders();
        },
        error: (err: HttpErrorResponse) => {
          // isLoading zaten finalize içinde false yapılacak
          this.error = err.message || 'Sipariş güncellenirken bir hata oluştu.';
          alert(this.error);
          console.error('Sipariş güncelleme hatası:', err);
        }
      });
  }

  cancelOrder(orderId: number | undefined): void {
    if (orderId === undefined) {
      this.error = "Sipariş IDsi geçersiz.";
      console.error('Geçersiz sipariş IDsi:', orderId);
      return;
    }

    if (confirm(`${orderId} ID'li siparişi iptal etmek istediğinizden emin misiniz?`)) {
      this.isLoading = true;

      this.apiService.put<OrderDto>(`admin/orders/${orderId}/cancel`, { reason: 'Admin tarafından iptal edildi' })
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
                console.log(`cancelOrder (ID: ${orderId}) finalize bloğu. isLoading false olarak ayarlanıyor.`);
                this.isLoading = false;
                // this.cdr.detectChanges(); // Opsiyonel
            })
        )
        .subscribe({
          next: (cancelledOrderDto: OrderDto) => {
            alert('Sipariş başarıyla iptal edildi.');
            this.loadOrders();
          },
          error: (err: HttpErrorResponse) => {
            // isLoading zaten finalize içinde false yapılacak
            this.error = err.message || 'Sipariş iptal edilemedi.';
            alert(this.error);
            console.error('Sipariş iptal hatası:', err);
          }
        });
    }
  }
}
