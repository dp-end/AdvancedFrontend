import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core'; // PLATFORM_ID ve Inject eklendi
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common'; // isPlatformBrowser eklendi
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// ProductResponseDto import yolu güncellendi (dosya adının küçük harf olduğu varsayıldı)
import { ProductResponseDto } from '../dto/ProductResponseDto';
import { Category } from '../models/category.model';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';
import { Product } from '../models/product.model'; // addToCart için hala kullanılabilir

@Component({
  selector: 'app-urunler',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CurrencyPipe
  ],
  templateUrl: './urunler.component.html',
  styleUrls: ['./urunler.component.scss']
})
export class UrunlerComponent implements OnInit, OnDestroy {
  searchText: string = '';
  allProducts: ProductResponseDto[] = []; // API'den gelen tüm ürünleri tutacak dizi (DTO tipinde)
  filteredProducts: ProductResponseDto[] = []; // Filtrelenmiş ve kullanıcıya gösterilecek ürünler (DTO tipinde)

  isLoading = true; // Genel yüklenme durumu (hem ürünler hem kategoriler için)
  errorMessage: string | null = null;

  categoriesForFilter: string[] = []; // Filtre için kullanılacak kategori adları
  typesForFilter: string[] = [];      // Filtre için kullanılacak tip adları (ürünlerden türetilmeye devam edebilir)

  selectedCategory: string | null = 'Tüm Kategoriler';
  selectedType: string | null = 'Tüm Çeşitler';

  private dataSubscription: Subscription | undefined; // Tek bir abonelik yönetecek

  // Backend API adresinizin ana kısmı, resim URL'lerini oluşturmak için kullanılacak.
  // Eğer ApiService içinde zaten bir baseUrl varsa, onu kullanmak daha iyi olabilir.
  // Şimdilik burada tanımlıyoruz, ancak idealde bir environment dosyasından gelmeli.
  private readonly apiBaseUrl = 'http://localhost:8080';

  constructor(
    private apiService: ApiService,
    private cartService: CartService,
    @Inject(PLATFORM_ID) private platformId: Object // Platform ID enjekte edildi (isPlatformBrowser için)
  ) {}

  ngOnInit(): void {
    console.log('UrunlerComponent ngOnInit çağrıldı.');
    this.loadInitialData(); // Ürünleri ve kategorileri yükle
  }

  /**
   * Hem ürünleri hem de tüm kategorileri API'den yükler.
   */
  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.dataSubscription?.unsubscribe(); // Önceki aboneliği iptal et

    this.dataSubscription = forkJoin({
      products: this.apiService.getPublicProducts().pipe( // Bu metot Observable<ProductResponseDto[]> dönmeli
        catchError((err: HttpErrorResponse) => {
          console.error('Herkese açık ürünler yüklenirken hata:', err);
          this.errorMessage = err.message || 'Ürünler yüklenirken bir hata oluştu.';
          return of([] as ProductResponseDto[]); // Hata durumunda boş ürün dizisi döndür
        })
      ),
      categories: this.apiService.getCategories().pipe( // Bu metot Observable<Category[]> dönmeli
        catchError((err: HttpErrorResponse) => {
          console.error('Kategoriler yüklenirken hata:', err);
          if (!this.errorMessage) { // Eğer ürün yükleme hatası yoksa, kategori hatasını göster
            this.errorMessage = err.message || 'Kategori filtresi için veriler yüklenemedi.';
          }
          return of([] as Category[]); // Hata durumunda boş kategori dizisi döndür
        })
      )
    }).subscribe({
      next: (response) => {
        // Gelen ürünlerin imageUrl'lerini tam URL'e çevir
        this.allProducts = response.products.map(product => ({
          ...product,
          imageUrl: this.getFullImageUrl(product.imageUrl)
        }));

        this.populateCategoryFilter(response.categories);
        this.populateTypeFilterFromProducts(); // Tipler hala ürünlerden türetiliyor
        this.applyFilters();
        this.isLoading = false;
        console.log('Herkese açık ürünler başarıyla yüklendi (işlenmiş imageUrl ile):', this.allProducts);
        console.log('Kategori filtresi için kategoriler yüklendi:', this.categoriesForFilter);
        if (this.allProducts.length === 0 && !this.errorMessage) {
          console.log('Gösterilecek herkese açık ürün bulunmuyor.');
        }
      },
      error: (err: HttpErrorResponse) => { // forkJoin'dan genel bir hata gelirse
        this.isLoading = false;
        this.errorMessage = err.message || 'Veriler yüklenirken beklenmedik bir hata oluştu.';
        console.error('loadInitialData genel hata:', err);
        this.allProducts = []; // Hata durumunda listeleri sıfırla
        this.filteredProducts = [];
        this.categoriesForFilter = ['Tüm Kategoriler']; // Varsayılana dön
        this.typesForFilter = ['Tüm Çeşitler']; // Varsayılana dön
      }
    });
  }

  /**
   * Verilen imageUrl'i tam bir URL'e dönüştürür veya varsayılan bir fallback (şeffaf GIF) sağlar.
   */
  getFullImageUrl(imageUrl: string | null | undefined): string {
    const transparentGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    if (!imageUrl) {
      return transparentGif;
    }
    // Eğer imageUrl zaten tam bir URL ise (http, https veya data:image ile başlıyorsa)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:image')) {
      return imageUrl;
    }
    // Eğer göreli bir yolsa, API base URL'ini başına ekle
    // Örnek: imageUrl "product-images/benim-resmim.jpg" ise
    // Sonuç "http://localhost:8080/product-images/benim-resmim.jpg" olmalı
    const separator = imageUrl.startsWith('/') ? '' : '/';
    return `${this.apiBaseUrl}${separator}${imageUrl}`;
  }

  populateCategoryFilter(apiCategories: Category[]): void {
    const categoryNames = apiCategories.map(cat => cat.name).filter(name => !!name).sort();
    this.categoriesForFilter = ['Tüm Kategoriler', ...new Set(categoryNames)];
    if (!this.categoriesForFilter.includes(this.selectedCategory || '')) {
        this.selectedCategory = 'Tüm Kategoriler';
    }
    console.log('Kategori filtresi API verisiyle oluşturuldu:', this.categoriesForFilter);
  }

  populateTypeFilterFromProducts(): void {
    const allTypes = new Set<string>();
    this.allProducts.forEach(product => {
      if (product.type) {
        allTypes.add(product.type);
      }
    });
    this.typesForFilter = ['Tüm Çeşitler', ...Array.from(allTypes).sort()];
    if (!this.typesForFilter.includes(this.selectedType || '')) {
        this.selectedType = 'Tüm Çeşitler';
    }
    console.log('Tip filtresi ürünlerden oluşturuldu:', this.typesForFilter);
  }

  applyFilters(): void {
    const query = this.searchText.toLowerCase().trim();
    this.filteredProducts = this.allProducts.filter(product => {
      if (!product.active) return false;
      const nameMatch = product.name.toLowerCase().includes(query);
      const categoryMatch = this.selectedCategory === 'Tüm Kategoriler' ||
                            (product.category === this.selectedCategory);
      const typeMatch = this.selectedType === 'Tüm Çeşitler' ||
                        (product.type === this.selectedType);
      return nameMatch && categoryMatch && typeMatch;
    });
  }

  onSearchChange(): void { this.applyFilters(); }

  onCategoryChange(eventOrValue: Event | string): void {
    if (typeof eventOrValue === 'string') { this.selectedCategory = eventOrValue; }
    else { this.selectedCategory = (eventOrValue.target as HTMLSelectElement).value; }
    this.applyFilters();
  }

  onTypeChange(eventOrValue: Event | string): void {
    if (typeof eventOrValue === 'string') { this.selectedType = eventOrValue; }
    else { this.selectedType = (eventOrValue.target as HTMLSelectElement).value; }
    this.applyFilters();
  }

  addToCart(productResponse: ProductResponseDto): void {
    // CartService'in Product tipini beklediğini varsayıyoruz.
    // ProductResponseDto'dan Product'a dönüşüm:
    const productToAdd: Product = {
        id: productResponse.id,
        name: productResponse.name,
        price: productResponse.price,
        description: productResponse.description || '',
        category: productResponse.category || '',
        type: productResponse.type || undefined,
        imageUrl: productResponse.imageUrl || undefined, // Bu da tam URL olmalı
        stockQuantity: productResponse.stockQuantity,
        active: productResponse.active
      };
    this.cartService.addItem(productToAdd);
    alert(`${productResponse.name} sepete eklendi!`);
  }

  /**
   * Resim yüklenirken bir hata oluşursa çağrılır ve resmin src'sini şeffaf bir GIF olarak ayarlar.
   * Bu fonksiyon HTML şablonunda (error)="handleImageError($event)" şeklinde kullanılmalıdır.
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.warn('Resim yüklenemedi (handleImageError tetiklendi), şeffaf GIF kullanılıyor. Hatalı src:', imgElement.src);
    imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  trackByProductId(index: number, product: ProductResponseDto): number {
    return product.id;
  }

  ngOnDestroy(): void {
    console.log('UrunlerComponent ngOnDestroy çağrıldı.');
    this.dataSubscription?.unsubscribe();
  }
}
