import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// ProductResponseDto'yu import et
import { ProductResponseDto } from '../dto/ProductResponseDto'; // Yolunu kontrol et
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './seller-products-component.component.html',
  styleUrls: ['./seller-products-component.component.scss']
})
export class SellerProductsComponent implements OnInit, OnDestroy {
  // Satıcının ürünlerini tutacak dizi ProductResponseDto[] olarak güncellendi
  sellerProducts: ProductResponseDto[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  orderCount: number = 0;
  isLoadingOrderCount = false;
  orderCountError: string | null = null;

  private productsSubscription: Subscription | undefined;
  private deleteSubscription: Subscription | undefined;
  private orderCountSubscription: Subscription | undefined;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('SellerProductsComponent ngOnInit çağrıldı.');
    this.loadSellerProducts();
    this.loadSellerOrderCount();
  }

  /**
   * Giriş yapmış satıcının ürünlerini API'den yükler.
   */
  loadSellerProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    console.log('loadSellerProducts çağrılıyor...');

    this.productsSubscription?.unsubscribe();

    // ApiService.getSellerProducts() artık Observable<ProductResponseDto[]> döndürüyor
    this.productsSubscription = this.apiService.getSellerProducts().subscribe({
      next: (products: ProductResponseDto[]) => { // products tipi ProductResponseDto[] olarak güncellendi
        this.sellerProducts = products;
        this.isLoading = false;
        console.log('Satıcı ürünleri yüklendi:', products);
        if (products.length === 0) {
          console.log('Satıcının gösterilecek ürünü bulunmuyor.');
        }
      },
      error: (err: HttpErrorResponse) => { // err tipi HttpErrorResponse olarak güncellendi
        this.errorMessage = err.message || 'Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        this.isLoading = false;
        console.error('Satıcı ürünleri yüklenirken hata:', err);
      }
    });
  }

  /**
   * Giriş yapmış satıcının bekleyen sipariş sayısını API'den yükler.
   */
  loadSellerOrderCount(): void {
    this.isLoadingOrderCount = true;
    this.orderCountError = null;
    console.log('loadSellerOrderCount çağrılıyor...');

    this.orderCountSubscription?.unsubscribe();

    this.orderCountSubscription = this.apiService.getSellerPendingOrderCount().subscribe({
        next: (count: number) => {
            this.orderCount = count;
            this.isLoadingOrderCount = false;
            console.log('Satıcının bekleyen sipariş sayısı:', count);
        },
        error: (err: HttpErrorResponse) => { // err tipi HttpErrorResponse olarak güncellendi
            this.orderCountError = err.message || 'Sipariş sayısı yüklenirken bir hata oluştu.';
            this.isLoadingOrderCount = false;
            console.error('Satıcı bekleyen sipariş sayısı yüklenirken hata:', err);
        }
    });
  }

  /**
   * Yeni ürün ekleme formuna yönlendirir.
   */
  navigateToAddProduct(): void {
    console.log('Yeni ürün ekleme sayfasına yönlendiriliyor: /seller/products/new');
    this.router.navigate(['/seller/products/new']);
  }

  /**
   * Belirli bir ürünü düzenleme formuna yönlendirir.
   * @param productId Düzenlenecek ürünün ID'si (number olmalı).
   */
  navigateToEditProduct(productId: number | undefined): void { // productId tipi number | undefined olarak güncellendi
    if (productId === undefined) {
      console.error('Düzenlenecek ürün IDsi tanımsız.');
      this.errorMessage = 'Düzenlenecek ürün seçilemedi. Lütfen tekrar deneyin.';
      return;
    }
    console.log(`Ürün ID ${productId} düzenleme sayfasına yönlendiriliyor: /seller/products/edit/${productId}`);
    this.router.navigate(['/seller/products/edit', productId]);
  }

  /**
   * Belirli bir ürünü siler (API aracılığıyla).
   * @param productId Silinecek ürünün ID'si (number olmalı).
   */
  deleteProduct(productId: number | undefined): void { // productId tipi number | undefined olarak güncellendi
    if (productId === undefined) {
      console.error('Silinecek ürün IDsi tanımsız.');
      this.errorMessage = 'Silinecek ürün seçilemedi. Lütfen tekrar deneyin.';
      return;
    }

    if (!confirm(`Bu ürünü (ID: ${productId}) silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }
    console.log(`Ürün ID ${productId} silme işlemi başlatılıyor...`);
    this.isLoading = true; // Silme işlemi sırasında yüklenme durumu

    this.deleteSubscription?.unsubscribe();

    // ApiService.deleteSellerProduct artık number tipinde ID bekliyor
    this.deleteSubscription = this.apiService.deleteSellerProduct(productId).subscribe({
      next: () => {
        this.isLoading = false;
        console.log(`Ürün ID ${productId} başarıyla silindi.`);
        alert('Ürün başarıyla silindi.');
        this.loadSellerProducts(); // Listeyi yenile
      },
      error: (err: HttpErrorResponse) => { // err tipi HttpErrorResponse olarak güncellendi
        this.isLoading = false;
        this.errorMessage = err.message || 'Ürün silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        console.error(`Ürün ID ${productId} silinirken hata:`, err);
        alert(`Ürün silinemedi: ${this.errorMessage}`);
      }
    });
  }

  /**
   * *ngFor döngüsünde ürünleri izlemek için kullanılır, performansı artırır.
   * @param index Döngüdeki öğenin indeksi.
   * @param product Döngüdeki ürün nesnesi (ProductResponseDto).
   * @returns Ürünün benzersiz ID'si (number).
   */
  trackByProductId(index: number, product: ProductResponseDto): number { // product tipi ProductResponseDto, dönüş tipi number
    return product.id;
  }

  ngOnDestroy(): void {
    console.log('SellerProductsComponent ngOnDestroy çağrıldı. Abonelikler sonlandırılıyor.');
    this.productsSubscription?.unsubscribe();
    this.deleteSubscription?.unsubscribe();
    this.orderCountSubscription?.unsubscribe();
  }
}
