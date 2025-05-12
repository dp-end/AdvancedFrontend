import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { CartService, CartItem } from '../services/cart.service';
import { Product } from '../models/product.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-sepet-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sepet-page.component.html',
  styleUrls: ['./sepet-page.component.scss']
})
export class SepetPageComponent implements OnInit, OnDestroy {
  cartItems$: Observable<CartItem[]>;
  isLoading: boolean = true;
  error: string | null = null;

  private cartSubscription: Subscription | undefined;

  constructor(
    public cartService: CartService,
    private router: Router
  ) {
    this.cartItems$ = this.cartService.cartItems$;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.cartSubscription = this.cartService.cartItems$.subscribe({
      next: (items) => {
        this.isLoading = false;
        if (items.length === 0) {
          console.log("Sepet boş (ngOnInit).");
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.error = "Sepet yüklenirken bir hata oluştu: " + err.message;
        console.error("Sepet yükleme hatası:", err);
      }
    });
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  removeFromCart(productId: number | string | undefined): void {
    if (productId === undefined) {
      console.error('Kaldırılacak ürün IDsi tanımsız.');
      return;
    }
    this.cartService.removeItem(productId);
  }

  updateItemQuantity(productId: number | string | undefined, event: Event): void {
    if (productId === undefined) {
      console.error('Güncellenecek ürün IDsi tanımsız.');
      return;
    }
    const inputElement = event.target as HTMLInputElement;
    const quantity = parseInt(inputElement.value, 10);
    if (!isNaN(quantity) && quantity >= 0) {
      this.cartService.updateQuantity(productId, quantity);
    } else if (inputElement.value === '') {
        this.cartService.updateQuantity(productId, 0);
    }
  }

  async proceedToCheckout(): Promise<void> {
    const currentItems = await firstValueFrom(this.cartItems$);

    if (currentItems.length === 0) {
      alert('Sepetiniz boş. Lütfen önce ürün ekleyin.');
      return;
    }

    // --- KATEGORİ KONTROLÜ KALDIRILDI ---
    // const uniqueCategories = new Set(
    //   currentItems
    //     .map(item => item.category) // Her ürünün kategorisini al
    //     .filter(category => !!category) // Tanımsız veya boş kategorileri filtrele
    // );
    // const uniqueCategoryCount = uniqueCategories.size;
    // const minimumCategoryRequirement = 3; // Minimum kategori sayısı gereksinimi

    // if (uniqueCategoryCount < minimumCategoryRequirement) {
    //   alert(`Ödeme işlemine devam etmek için sepetinizde en az ${minimumCategoryRequirement} farklı kategoriden ürün bulunmalıdır. Şu anda ${uniqueCategoryCount} farklı kategoriden ürün var.`);
    //   return;
    // }
    // --- KATEGORİ KONTROLÜ SONU ---

    console.log('Checkout şartları sağlandı (kategori kontrolü olmadan), /checkout rotasına yönlendiriliyor...');
    this.router.navigate(['/checkout']);
  }

  getTotalPrice(): number {
    return this.cartService.getTotalPrice();
  }

  trackByItemId(index: number, item: CartItem): number | string | null | undefined {
    return item.id;
  }

  navigateToProduct(productId: number | string | undefined): void {
    if (productId === undefined || productId === null) {
      console.warn('Ürün detayı için ID tanımsız veya null, yönlendirme yapılamıyor.');
      return;
    }
    // Sepet overlay'i açıksa kapatma mantığı eklenebilir (eğer bu bir modal/overlay ise)
    // this.cartService.closeCart();
    this.router.navigate(['/urun', productId]);
  }

  clearCart(): void {
    if (confirm("Sepetinizdeki tüm ürünleri silmek istediğinizden emin misiniz?")) {
      this.cartService.clearCart();
    }
  }
}
