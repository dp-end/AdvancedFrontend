import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngIf, *ngFor, async pipe için
import { Router, RouterLink } from '@angular/router'; // Router ve RouterLink import edildi
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../services/cart.service'; // CartService import

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink] // RouterLink imports dizisine eklendi
})
export class CartComponent implements OnInit, OnDestroy {
  isVisible = false;
  cartItems: CartItem[] = [];
  private visibilitySubscription!: Subscription;
  private itemsSubscription!: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router // Router enjekte edildi
  ) {}

  ngOnInit(): void {
    this.visibilitySubscription = this.cartService.isCartVisible$.subscribe(visible => {
      this.isVisible = visible;
    });
    this.itemsSubscription = this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
  }

  ngOnDestroy(): void {
    if (this.visibilitySubscription) this.visibilitySubscription.unsubscribe();
    if (this.itemsSubscription) this.itemsSubscription.unsubscribe();
  }

  getTotalPrice(): number {
    return this.cartService.getTotalPrice();
  }

  closeCart() {
    this.cartService.closeCart();
  }

  removeFromCart(productId: number | string | undefined): void { // productId undefined olabilir
    if (productId === undefined) {
      console.error('Kaldırılacak ürün IDsi tanımsız.');
      return;
    }
    this.cartService.removeItem(productId);
  }

  updateItemQuantity(productId: number | string | undefined, event: Event): void { // productId undefined olabilir
    if (productId === undefined) {
      console.error('Güncellenecek ürün IDsi tanımsız.');
      return;
    }
    const inputElement = event.target as HTMLInputElement;
    const quantity = parseInt(inputElement.value, 10);
    if (!isNaN(quantity) && quantity >= 0) { // Miktar 0 da olabilir (ürünü kaldırmak için)
      this.cartService.updateQuantity(productId, quantity);
    } else if (inputElement.value === '') {
        // Input boşsa, miktarı 0 olarak kabul et veya bir hata göster
        this.cartService.updateQuantity(productId, 0); // Örnek: boş input = 0 adet
    }
  }

  // --- HTML Şablonunda Kullanılan Eksik Metotlar Eklendi ---

  /**
   * *ngFor döngüsünde ürünleri izlemek için kullanılır, performansı artırır.
   * @param index Döngüdeki öğenin indeksi.
   * @param item Döngüdeki sepet öğesi.
   * @returns Ürünün benzersiz ID'si veya null/undefined.
   */
  trackByItemId(index: number, item: CartItem): number | string | null | undefined {
    return item.id;
  }

  /**
   * Kullanıcıyı ürün detay sayfasına yönlendirir.
   * @param productId Yönlendirilecek ürünün ID'si.
   */
  navigateToProduct(productId: number | string | undefined): void {
    if (productId === undefined) {
      console.warn('Ürün detayı için ID tanımsız, yönlendirme yapılamıyor.');
      return;
    }
    this.cartService.closeCart(); // Sepeti kapat
    this.router.navigate(['/urun', productId]); // Ürün detay sayfasına yönlendir
  }

  /**
   * Kullanıcıyı ödeme sayfasına yönlendirir.
   */
  navigateToCheckout(): void {
    if (this.cartItems.length > 0) {
      this.cartService.closeCart(); // Sepeti kapat
      this.router.navigate(['/checkout']); // Ödeme sayfasına yönlendir
    } else {
      alert("Ödeme yapmak için sepetinizde ürün bulunmalıdır.");
    }
  }

  /**
   * Sepetteki tüm ürünleri temizler.
   */
  clearCart(): void {
    if (confirm("Sepetinizdeki tüm ürünleri silmek istediğinizden emin misiniz?")) {
      this.cartService.clearCart();
    }
  }
}
