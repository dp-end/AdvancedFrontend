// src/app/components/admin/add-product/add-product.component.ts

import { Component, OnInit } from '@angular/core'; // OnInit eklendi (formu initialize etmek için)
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms'; // FormBuilder eklendi
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // HttpErrorResponse import edildi

// API'den dönecek yanıt için ProductResponseDto'yu import et
import { ProductResponseDto } from '../../dto/ProductResponseDto'; // Yolunu kontrol et
// Backend'e gönderilecek ProductDto için bir arayüz (opsiyonel ama iyi pratik)
// Eğer Product modeli (models/product.model.ts) bu amaçla kullanılıyorsa o da olabilir.
// Şimdilik productForm.value'nun backend ProductDto'su ile uyumlu olduğunu varsayıyoruz.
// import { ProductCreateDto } from '../../../dto/product-create.dto';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent implements OnInit { // OnInit implement edildi

  productForm: FormGroup; // FormGroup olarak tipini belirtmek daha iyi
  isSubmitting = false;
  errorMessage: string | null = null; // Hata mesajları için

  constructor(
    private fb: FormBuilder, // FormBuilder enjekte edildi
    private apiService: ApiService,
    private router: Router
  ) {
    // Formu constructor'da veya ngOnInit'te FormBuilder ile oluşturmak daha yaygındır.
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      price: [null as number | null, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      description: [''],
      category: ['', [Validators.required, Validators.maxLength(100)]], // Kategori eklendi
      type: ['', [Validators.maxLength(100)]], // Tip eklendi
      imageUrl: [''], // URL veya dosya adı için
      stockQuantity: [0, [Validators.required, Validators.min(0)]], // Stok miktarı eklendi
      active: [true, Validators.required] // Aktif durumu eklendi
    });
  }

  ngOnInit(): void {
    // Gerekirse başlangıç değerleri burada set edilebilir veya route parametreleri işlenebilir.
  }

  // Form kontrollerine kolay erişim için getter'lar (isteğe bağlı)
  get name() { return this.productForm.get('name'); }
  get price() { return this.productForm.get('price'); }
  get description() { return this.productForm.get('description'); }
  get category() { return this.productForm.get('category'); }
  get type() { return this.productForm.get('type'); }
  get imageUrl() { return this.productForm.get('imageUrl'); }
  get stockQuantity() { return this.productForm.get('stockQuantity'); }
  get active() { return this.productForm.get('active'); }


  onSubmit(): void {
    if (this.productForm.invalid) { // Form geçerli değilse
      this.productForm.markAllAsTouched(); // Tüm alanları dokunulmuş olarak işaretle (validasyon mesajları görünsün)
      this.errorMessage = "Lütfen formdaki tüm zorunlu alanları doğru bir şekilde doldurun.";
      console.warn('Form gönderilemedi, validasyon hataları var:', this.productForm.errors);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null; // Önceki hata mesajını temizle

    // Backend'e gönderilecek payload. Backend'deki ProductDto (Java) ile uyumlu olmalı.
    // Formdaki değerleri doğrudan kullanıyoruz.
    const productPayload = this.productForm.value;
    console.log('Ürün bilgisi gönderiliyor:', productPayload);

    // ApiService.post metodu artık public ve ProductResponseDto döndürüyor.
    // Endpoint'in '/api/admin/products' veya sadece '/products' olup olmadığına dikkat edin.
    // ProductController'daki @PostMapping @PreAuthorize("hasRole('ADMIN')") /api/products adresini dinliyordu.
    this.apiService.post<ProductResponseDto>('products', productPayload)
      .subscribe({
        next: (response: ProductResponseDto) => { // response tipi ProductResponseDto olarak güncellendi
          console.log('Ürün başarıyla eklendi:', response);
          alert('Ürün başarıyla eklendi!');
          this.isSubmitting = false;
          this.productForm.reset({ active: true }); // Formu sıfırla (aktif hariç)
          // Başarılı ekleme sonrası admin ürün listesine veya ürün detayına yönlendirilebilir.
          this.router.navigate(['/admin/manage-products']); // Örnek yönlendirme
        },
        error: (err: HttpErrorResponse) => { // err tipi HttpErrorResponse olarak güncellendi
          console.error('Ürün ekleme hatası:', err);
          if (err.error && typeof err.error.message === 'string') {
            this.errorMessage = err.error.message;
          } else if (err.error && typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else {
            this.errorMessage = err.message || 'Ürün eklenirken bilinmeyen bir hata oluştu.';
          }
          alert(`Ürün eklenemedi: ${this.errorMessage}`);
          this.isSubmitting = false;
        }
      });
  }
}
