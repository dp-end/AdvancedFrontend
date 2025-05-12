import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Linkler için
import { Observable, of, Subscription } from 'rxjs'; // Subscription eklendi
import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse import edildi
import { ApiService } from '../../services/api.service'; // Yolunu kontrol et

// ProductResponseDto'yu import et
import { ProductResponseDto } from '../../dto/ProductResponseDto';

@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.scss']
})
export class ManageProductsComponent implements OnInit {

  products$: Observable<ProductResponseDto[]>; // Tip ProductResponseDto[] olarak güncellendi
  isLoading = true;
  error: string | null = null;

  private productsSubscription: Subscription | undefined;
  private deleteSubscription: Subscription | undefined;

  constructor(private apiService: ApiService) {
    this.products$ = of([]); // Başlangıçta boş bir ProductResponseDto dizisi observable'ı
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.error = null;

    this.productsSubscription?.unsubscribe(); // Önceki aboneliği iptal et
    this.productsSubscription = this.apiService.getAllProductsForAdmin().subscribe({
      next: (data: ProductResponseDto[]) => { // data tipi ProductResponseDto[] olarak güncellendi
        this.products$ = of(data); // Observable'ı güncelle
        this.isLoading = false;
        if (data.length === 0) {
          console.log("Admin için gösterilecek ürün bulunmuyor.");
        }
      },
      error: (err: HttpErrorResponse) => { // err tipi HttpErrorResponse olarak güncellendi
        console.error("Admin için ürünler yüklenirken hata:", err);
        this.error = err.message || "Ürünler yüklenirken bir hata oluştu.";
        this.isLoading = false;
      }
    });
  }

  // Ürün silme (veya backend'de pasif yapma) işlemi
  deleteProduct(id: number | undefined): void { // id tipi number | undefined olarak güncellendi
    if (id === undefined) { // undefined kontrolü
        console.error('Silinecek ürün IDsi tanımsız.');
        this.error = 'Silinecek ürün seçilemedi.';
        return;
    }
    if (confirm(`${id} ID'li ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      this.isLoading = true; // Silme işlemi sırasında yüklenme durumu
      this.deleteSubscription?.unsubscribe(); // Önceki aboneliği iptal et
      // ApiService'teki delete metodu genel olduğu için endpoint'i tam olarak veriyoruz.
      // Backend'deki /api/admin/products/{id} endpoint'ini hedeflediğini varsayıyoruz.
      // Eğer ProductService'te admin için özel bir deleteProduct(id: number) metodu varsa, o kullanılmalı.
      // Şimdilik genel delete metodunu kullanıyoruz.
      this.deleteSubscription = this.apiService.delete<void>(`admin/products/${id}`) // Endpoint admin path'ini içermeli
        .subscribe({
          next: () => {
            this.isLoading = false;
            alert('Ürün başarıyla silindi.'); // Veya pasif yapıldıysa mesajı ona göre düzenle
            this.loadProducts(); // Listeyi yenile
          },
          error: (err: HttpErrorResponse) => { // err tipi HttpErrorResponse olarak güncellendi
            this.isLoading = false;
            console.error(`Ürün (ID: ${id}) silinirken hata:`, err);
            this.error = err.message || `Ürün (ID: ${id}) silinirken bir hata oluştu.`;
            alert(this.error);
          }
        });
    }
  }

  // Component yok edildiğinde abonelikleri iptal et
  ngOnDestroy(): void {
    this.productsSubscription?.unsubscribe();
    this.deleteSubscription?.unsubscribe();
  }
}
