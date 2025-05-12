import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription, of, Observable } from 'rxjs'; // Observable eklendi
import { switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse import edildi

// ProductResponseDto'yu import et
import { ProductResponseDto } from '../dto/ProductResponseDto'; // Yolunu kontrol et
import { Review } from '../models/review.model';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    CurrencyPipe
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: ProductResponseDto | null = null; // Tip ProductResponseDto olarak güncellendi
  productId: string | null = null; // Route'dan string olarak gelir
  numericProductId: number | null = null; // Sayısal ID'yi tutmak için

  isLoadingProduct = true;
  productError: string | null = null;

  reviews: Review[] = [];
  isLoadingReviews = false;
  reviewError: string | null = null;
  showReviewForm = false;
  isReviewSubmitting = false;
  reviewForm = new FormGroup({
    rating: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(5)]),
    comment: new FormControl('', [Validators.required, Validators.minLength(10)])
  });

  private routeSub: Subscription | undefined;
  // productSub kaldırıldı, ana routeSub içindeki switchMap bunu yönetiyor
  private reviewLoadSub: Subscription | undefined;
  private reviewSubmitSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private cartService: CartService,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.routeSub = this.route.paramMap.pipe(
        tap(() => {
          this.product = null;
          this.isLoadingProduct = true;
          this.productError = null;
          this.reviews = [];
          this.reviewError = null;
          this.showReviewForm = false;
          this.reviewForm.reset();
          this.reviewLoadSub?.unsubscribe();
        }),
        switchMap(params => {
          this.productId = params.get('id');
          if (!this.productId) {
            this.isLoadingProduct = false;
            this.productError = 'Ürün ID\'si URL\'de bulunamadı.';
            console.error(this.productError);
            return of(null);
          }

          this.numericProductId = Number(this.productId); // ID'yi sayıya çevir
          if (isNaN(this.numericProductId)) {
            this.isLoadingProduct = false;
            this.productError = 'Geçersiz Ürün ID formatı.';
            console.error(this.productError);
            return of(null);
          }
          // ApiService.get<ProductResponseDto> veya özel bir metot (getPublicProductById gibi) kullanılmalı
          // ApiService'teki get metodu public yapılmıştı.
          // getSellerProductById yerine genel bir ürün getirme metodu olmalı (eğer public ise)
          // Şimdilik ApiService.get metodunu kullanıyoruz, bu metodun ProductResponseDto döndürdüğünü varsayıyoruz.
          // Eğer ApiService'te getPublicProductById(id: number): Observable<ProductResponseDto> gibi bir metot varsa onu kullanın.
          console.log(`Ürün detayı isteniyor: /products/${this.numericProductId}`);
          return this.apiService.get<ProductResponseDto>(`products/${this.numericProductId}`).pipe(
            catchError((err: HttpErrorResponse) => { // err tipini HttpErrorResponse yap
              this.productError = err.message || 'Ürün yüklenirken bir sunucu hatası oluştu.';
              console.error('Ürün yükleme hatası (catchError içi):', err);
              return of(null);
            })
          );
        })
      ).subscribe({
        next: (data: ProductResponseDto | null) => { // data tipi ProductResponseDto | null olarak güncellendi
          this.isLoadingProduct = false;
          if (data) {
            this.product = data;
            // TS2531 hatasını çözmek için null kontrolü
            if (this.product && !this.product.active) {
              this.productError = 'Bu ürün şu anda satışta değil.';
              this.product = null;
            } else if (this.numericProductId && this.product && this.product.active) { // numericProductId null değilse ve ürün aktifse
              this.loadReviews(this.numericProductId); // numericProductId (number) kullanıldı
            }
          } else if (!this.productError) {
            this.productError = 'Ürün bulunamadı.';
          }
        },
        error: (err: HttpErrorResponse) => { // err tipini HttpErrorResponse yap
          this.isLoadingProduct = false;
          this.product = null;
          this.productError = err.message || 'Ürün yüklenirken beklenmedik bir hata oluştu.';
          console.error('Ana subscribe ürün yükleme hatası:', err);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    // productSub kaldırıldığı için onun unsubscribe'ına gerek yok
    this.reviewLoadSub?.unsubscribe();
    this.reviewSubmitSub?.unsubscribe();
  }

  addToCart(): void {
    // TS2531 hatasını çözmek için null kontrolü
    if (this.product && this.product.active && (this.product.stockQuantity ?? 0) > 0) {
      // Sepete ekleme işlemi Product tipini bekliyorsa, ProductResponseDto'dan Product'a map'leme gerekebilir
      // Şimdilik ProductResponseDto'nun Product ile uyumlu olduğunu varsayıyoruz veya CartService bunu handle ediyor.
      // Eğer CartService Product bekliyorsa:
      // const productToAdd: Product = { ...this.product, id: this.product.id, category: this.product.category || '' };
      this.cartService.addItem(this.product as any); // Geçici olarak 'as any', CartService'in beklentisine göre düzeltilmeli
      alert(`${this.product.name} sepete eklendi!`);
    } else if (this.product) {
      alert(`${this.product.name} şu anda stokta bulunmuyor veya aktif değil.`);
    } else {
      console.error('Sepete eklenemedi, ürün bilgisi yüklenemedi.');
    }
  }

  loadReviews(productId: number): void { // productId tipi number olarak güncellendi
    this.isLoadingReviews = true;
    this.reviewError = null;
    this.reviewLoadSub?.unsubscribe();

    this.reviewLoadSub = this.apiService.getProductReviews(productId).pipe( // productId (number) kullanıldı
      finalize(() => this.isLoadingReviews = false),
      catchError((err: HttpErrorResponse) => { // err tipini HttpErrorResponse yap
        this.reviewError = err.message || 'Yorumlar yüklenirken bir hata oluştu.';
        return of([]);
      })
    ).subscribe((fetchedReviews: Review[]) => { // fetchedReviews tipini Review[] yap
      this.reviews = fetchedReviews;
    });
  }

  toggleReviewForm(): void {
    if (!this.authService.isLoggedIn()) {
      this.authService.promptLogin();
      return;
    }
    this.showReviewForm = !this.showReviewForm;
    if (this.showReviewForm) {
      this.reviewForm.reset({ rating: null, comment: '' }); // rating'i null olarak resetle
    }
  }

  onSubmitReview(): void {
    if (this.reviewForm.invalid || !this.numericProductId) { // numericProductId kontrolü
      this.reviewForm.markAllAsTouched();
      alert('Lütfen geçerli bir puan verin ve yorumunuzu yazın.');
      return;
    }
    this.isReviewSubmitting = true;
    this.reviewSubmitSub?.unsubscribe();

    const reviewData = {
      rating: this.reviewForm.value.rating!,
      comment: this.reviewForm.value.comment!
    };

    this.reviewSubmitSub = this.apiService.addProductReview(this.numericProductId, reviewData).pipe( // numericProductId (number) kullanıldı
      finalize(() => this.isReviewSubmitting = false),
      catchError((err: HttpErrorResponse) => { // err tipini HttpErrorResponse yap
        alert(`Yorum gönderilemedi: ${err.message || 'Bilinmeyen bir hata.'}`);
        return of(null);
      })
    ).subscribe((newReview: Review | null) => { // newReview tipini Review | null yap
      if (newReview) {
        alert('Yorumunuz başarıyla gönderildi!');
        if (this.numericProductId) this.loadReviews(this.numericProductId); // numericProductId (number) kullanıldı
        this.showReviewForm = false;
      }
    });
  }

  getStars(rating: number | null | undefined): boolean[] {
    const numRating = rating ?? 0;
    return Array(5).fill(false).map((_, i) => i < numRating);
  }

  goBack(): void {
    this.router.navigate(['/urunler']);
  }
}
