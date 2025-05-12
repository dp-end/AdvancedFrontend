import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, catchError, map } from 'rxjs';

// Arayüzleri ve DTO'ları doğru yollardan import edin
import { Review } from '../models/review.model';
import { Product } from '../models/product.model'; // Bu, backend'e gönderilen DTO için kullanılabilir
import { OrderDto } from '../dto/order.dto';
import { User } from '../models/user.model';
import { AdminDashboardStats } from '../models/admin-stats.model';
import { ContactMessageDto } from '../dto/contact-message.dto';
import { ContactMessage } from '../models/contact-message.model';
import { Category } from '../models/category.model';

// DTO import yolları (dosya adlarının küçük harf olduğunu varsayıyoruz)
import { ProductResponseDto } from '../dto/ProductResponseDto';
import { SellerInfoResponseDto } from '../dto/SellerInfoResponseDto';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8080/api'; // Backend API adresiniz

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // === KATEGORİ METOTLARI ===
  getCategories(): Observable<Category[]> {
    console.log("API: Tüm kategoriler getiriliyor...");
    return this.http.get<Category[]>(`${this.apiUrl}/categories`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // === GENEL HTTP METOTLARI (PUBLIC) ===
  public get<T>(endpoint: string): Observable<T> {
    const headers = this.getAuthHeaders();
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  public post<T>(endpoint: string, data: any): Observable<T> {
    const headers = this.getAuthHeaders();
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  public put<T>(endpoint: string, data: any): Observable<T> {
    const headers = this.getAuthHeaders();
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  public delete<T>(endpoint: string): Observable<T> {
    const headers = this.getAuthHeaders();
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  // === GENEL ÜRÜN METOTLARI (TÜM KULLANICILAR İÇİN) ===
  getPublicProducts(): Observable<ProductResponseDto[]> {
    console.log("API: Herkese açık aktif ürünler getiriliyor (endpoint: /api/products)...");
    return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
      map(products => products.map(product => this.mapToProductResponseDto(product))),
      catchError(error => this.handleError(error))
    );
  }

  // === SATICI ÜRÜN YÖNETİMİ METOTLARI ===
  getSellerProducts(): Observable<ProductResponseDto[]> {
    console.log("API: Satıcının ürünleri getiriliyor...");
    return this.get<any[]>('seller/products').pipe(
      map(products => products.map(product => this.mapToProductResponseDto(product)))
    );
  }

  getSellerProductById(productId: number): Observable<ProductResponseDto> {
    console.log(`API: Satıcının ${productId} ID'li ürünü getiriliyor...`);
    return this.get<any>(`seller/products/${productId}`).pipe(
      map(product => this.mapToProductResponseDto(product))
    );
  }

  createSellerProduct(formData: FormData): Observable<ProductResponseDto> {
    console.log("API: Satıcı için yeni ürün (dosya ile) oluşturuluyor...");
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/seller/products`, formData, { headers }).pipe(
      map(product => this.mapToProductResponseDto(product)),
      catchError(error => this.handleError(error))
    );
  }

  updateSellerProduct(productId: number, formData: FormData): Observable<ProductResponseDto> {
    console.log(`API: Satıcının ${productId} ID'li ürünü (dosya ile) güncelleniyor...`);
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/seller/products/${productId}`, formData, { headers }).pipe(
      map(product => this.mapToProductResponseDto(product)),
      catchError(error => this.handleError(error))
    );
  }

  deleteSellerProduct(productId: number): Observable<void> {
    console.log(`API: Satıcının ${productId} ID'li ürünü siliniyor...`);
    return this.delete<void>(`seller/products/${productId}`);
  }

  // === SATICI SİPARİŞ YÖNETİMİ METOTLARI ===
  getSellerOrders(statusFilter?: string): Observable<OrderDto[]> {
    let endpoint = 'seller/orders/my-orders';
    if (statusFilter && statusFilter.trim() !== '') {
      endpoint += `?statusFilter=${encodeURIComponent(statusFilter)}`;
    }
    return this.get<OrderDto[]>(endpoint);
  }

  updateSellerOrderStatus(orderId: number, newStatus: string): Observable<OrderDto> {
    return this.put<OrderDto>(`seller/orders/${orderId}/status`, { newStatus });
  }

  getSellerPendingOrderCount(): Observable<number> {
    return this.get<number>('seller/orders/count/pending');
  }

  // === KULLANICI SİPARİŞ METODU ===
  getCurrentUserOrders(): Observable<OrderDto[]> {
    return this.get<OrderDto[]>('orders/my-orders');
  }

  // === YORUM METOTLARI ===
  getProductReviews(productId: number): Observable<Review[]> {
    return this.get<Review[]>(`products/${productId}/reviews`);
  }

  addProductReview(productId: number, reviewData: { rating: number; comment: string }): Observable<Review> {
    return this.post<Review>(`products/${productId}/reviews`, reviewData);
  }

  // === ADMIN METOTLARI ===
  getAllProductsForAdmin(): Observable<ProductResponseDto[]> {
    console.log("API: Admin için tüm ürünler getiriliyor...");
    return this.get<any[]>('admin/products').pipe(
      map(products => products.map(product => this.mapToProductResponseDto(product)))
    );
  }

  getAllOrdersForAdmin(): Observable<OrderDto[]> {
    return this.get<OrderDto[]>('admin/orders');
  }

  getAllUsersForAdmin(): Observable<User[]> {
    return this.get<User[]>('admin/users');
  }

  updateUserStatus(userId: number, enabled: boolean): Observable<User> {
    return this.put<User>(`admin/users/${userId}/status`, { enabled });
  }

  getAdminDashboardStats(): Observable<AdminDashboardStats> {
    return this.get<AdminDashboardStats>('admin/dashboard/stats');
  }

  // === İLETİŞİM METOTLARI ===
  sendContactMessage(messageData: ContactMessageDto): Observable<{ message: string }> {
    return this.post<{ message: string }>('contact/message', messageData);
  }

  sendDesignSubmission(formData: FormData): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ message: string }>(`${this.apiUrl}/contact/design`, formData, { headers })
      .pipe(catchError(error => this.handleError(error)));
  }

  getAllMessages(): Observable<ContactMessage[]> {
    return this.get<ContactMessage[]>('admin/messages');
  }

  // === YARDIMCI METOTLAR ===
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ApiService Hata Yakaladı (handleError başlangıcı):', JSON.parse(JSON.stringify(error)));
    let errorMessage = 'Bilinmeyen bir hata oluştu! Lütfen daha sonra tekrar deneyin.';

    if (isPlatformBrowser(this.platformId) && typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
      errorMessage = `İstemci veya ağ hatası: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = 'Sunucuya ulaşılamıyor. Lütfen ağ bağlantınızı kontrol edin veya sunucunun çalıştığından emin olun.';
    } else {
      const backendErrorBody = error.error;
      if (error.status === 401) {
        errorMessage = 'Bu işlem için oturum açmanız gerekmektedir veya oturumunuz zaman aşımına uğramıştır (401). Lütfen tekrar giriş yapmayı deneyin.';
      } else if (error.status === 403) {
        errorMessage = `Bu kaynağa erişim yetkiniz bulunmuyor (403 Forbidden - URL: ${error.url}). Lütfen gerekli izinlere sahip olduğunuzdan emin olun.`;
      } else if (backendErrorBody && typeof backendErrorBody.message === 'string' && backendErrorBody.message.trim() !== '') {
        errorMessage = backendErrorBody.message;
      } else if (typeof backendErrorBody === 'string' && backendErrorBody.trim() !== '') {
        errorMessage = backendErrorBody;
      } else {
        errorMessage = `Sunucu hatası (${error.status}): ${error.statusText || 'Bilinmeyen sunucu hatası'}. Daha fazla bilgi için konsolu kontrol edin.`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  private mapToProductResponseDto(product: any): ProductResponseDto {
    return {
      id: Number(product.id),
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl,
      category: product.category,
      type: product.type,
      active: product.active,
      stockQuantity: product.stockQuantity ? Number(product.stockQuantity) : 0,
      seller: product.seller ? {
        id: Number(product.seller.id),
        firstName: product.seller.firstName,
        lastName: product.seller.lastName
      } as SellerInfoResponseDto : null
    } as ProductResponseDto;
  }
}
