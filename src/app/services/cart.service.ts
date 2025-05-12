import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model'; // <-- Product modelden import edildi

// CartItem arayüzü Product'ı genişletiyor
export interface CartItem extends Product {
  quantity: number; // Bu alanın Product modelinde olmadığını veya number olmadığını varsayıyoruz
  // Eğer Product modelinde zaten number tipinde bir quantity varsa, bu satır gereksiz olabilir
  // veya CartItem'a özgü ek özellikler buraya eklenebilir.
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSource = new BehaviorSubject<CartItem[]>([]);
  private isCartVisibleSource = new BehaviorSubject<boolean>(false);

  cartItems$ = this.cartItemsSource.asObservable();
  isCartVisible$ = this.isCartVisibleSource.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart: CartItem[] = JSON.parse(savedCart);
          // Ekstra güvenlik: Her bir item'ın price ve quantity değerlerini kontrol et
          parsedCart.forEach(item => {
            item.price = item.price ?? 0; // price null ise 0 ata
            item.quantity = item.quantity ?? 1; // quantity null ise 1 ata (veya 0, duruma göre)
            if (typeof item.id === 'string') { // Eğer ID string ise number'a çevir
                item.id = Number(item.id);
            }
          });
          this.cartItemsSource.next(parsedCart);
        }
        catch (e) {
          console.error("Error parsing cart from localStorage", e);
          localStorage.removeItem('cart');
        }
      }
    }
  }

  private saveCart(items: CartItem[]): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }

  addItem(product: Product, quantity: number = 1): void {
    const currentItems = this.cartItemsSource.getValue();
    const existingItemIndex = currentItems.findIndex(item => item.id === product.id);

    // Product'tan gelen price null ise 0 olarak kabul et
    const productPrice = product.price ?? 0;

    if (existingItemIndex > -1) {
      currentItems[existingItemIndex].quantity += quantity;
    } else {
      // Yeni CartItem oluştururken price'ın number olduğundan emin ol
      currentItems.push({ ...product, price: productPrice, quantity });
    }
    this.cartItemsSource.next([...currentItems]);
    this.saveCart(currentItems);
  }

  removeItem(productId: number | string): void {
      const currentItems = this.cartItemsSource.getValue().filter(item => item.id !== productId);
      this.cartItemsSource.next(currentItems);
      this.saveCart(currentItems);
  }

  updateQuantity(productId: number | string, quantity: number): void {
      const currentItems = this.cartItemsSource.getValue();
      const itemIndex = currentItems.findIndex(item => item.id === productId);
      if (itemIndex > -1) {
          if (quantity > 0) {
            currentItems[itemIndex].quantity = quantity;
          } else {
            currentItems.splice(itemIndex, 1); // Miktar 0 veya daha az ise ürünü kaldır
          }
          this.cartItemsSource.next([...currentItems]);
          this.saveCart(currentItems);
      }
  }

  clearCart(): void {
      this.cartItemsSource.next([]);
      this.saveCart([]);
  }

  getTotalPrice(): number {
      return this.cartItemsSource.getValue().reduce((total, item) => {
        // DÜZELTME: item.price ve item.quantity için nullish coalescing operatörü (??) kullanıldı
        const price = item.price ?? 0;
        const quantity = item.quantity ?? 0; // CartItem'da quantity: number olduğu için bu ?? 0 gerekmeyebilir ama ekstra güvenlik
        return total + (price * quantity);
      }, 0);
  }

  toggleCartVisibility(): void {
    this.isCartVisibleSource.next(!this.isCartVisibleSource.value);
  }

  openCart(): void {
    this.isCartVisibleSource.next(true);
  }

  closeCart(): void {
    this.isCartVisibleSource.next(false);
  }
}
