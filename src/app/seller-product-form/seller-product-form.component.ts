import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subscription, switchMap, of, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { Product } from '../models/product.model'; // Bu, form verileri için kullanılabilir
import { Category } from '../models/category.model';
import { ApiService } from '../services/api.service';

// YENİ IMPORT: ProductResponseDto'yu doğru yoldan import edin
// Projenizdeki product-response.dto.ts dosyasının yolunu kontrol edin.
// Önceki yol: import { ProductResponseDto } from '../models/product-response.dto';
import { ProductResponseDto } from '../dto/ProductResponseDto'; // YOL GÜNCELLENDİ

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './seller-product-form.component.html',
  styleUrls: ['./seller-product-form.component.scss']
})
export class SellerProductFormComponent implements OnInit, OnDestroy {
  productForm: FormGroup;
  isEditMode = false;
  productId: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  pageTitle = 'Yeni Ürün Ekle';

  availableCategories: Category[] = [];

  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = 'assets/images/default-product.png'; // Varsayılan resim yolu
  public readonly defaultImageUrl = 'assets/images/default-product.png';

  private routeSubscription: Subscription | undefined;
  private submitSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(5000)]],
      price: [null as number | null, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      category: [null as string | null, [Validators.required]],
      type: ['', [Validators.maxLength(100)]],
      imageUrl: [''], // Mevcut resim URL'sini veya kaldırıldığında boş string'i tutar
      stockQuantity: [0 as number, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
      active: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('SellerProductFormComponent ngOnInit çağrıldı.');
    this.imagePreviewUrl = this.defaultImageUrl;

    const categories$ = this.apiService.getCategories();

    this.routeSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        this.productId = params.get('id');
        this.productForm.reset({ active: true, imageUrl: '', category: null });
        this.selectedFile = null;
        this.imagePreviewUrl = this.defaultImageUrl;
        this.errorMessage = null;
        this.successMessage = null;

        if (this.productId) {
          this.isEditMode = true;
          this.pageTitle = 'Ürünü Düzenle';
          this.isLoading = true;
          console.log(`Düzenleme modu: Ürün ID ${this.productId} yükleniyor...`);
          const numericProductId = Number(this.productId);
          return forkJoin({
            categories: categories$,
            // ApiService.getSellerProductById metodunun Observable<ProductResponseDto> döndürdüğünü varsayıyoruz
            product: this.apiService.getSellerProductById(numericProductId)
          });
        }
        this.isEditMode = false;
        this.pageTitle = 'Yeni Ürün Ekle';
        console.log('Yeni ürün ekleme modu.');
        return forkJoin({
            categories: categories$,
            product: of(null) // Yeni ürün modunda product null
        });
      })
    ).subscribe({
      // product tipini ProductResponseDto | null olarak güncelleyin
      next: (result: { categories: Category[], product: ProductResponseDto | null }) => {
        this.availableCategories = result.categories;
        console.log('Kategoriler yüklendi:', this.availableCategories);

        if (this.isEditMode && result.product) {
          console.log('Düzenlenecek ürün bilgileri forma aktarılıyor:', result.product);
          // ProductResponseDto'dan gelen category string olduğu için doğrudan kullanılabilir
          // ProductResponseDto'da 'seller' alanı da olabilir, bu yüzden onu da destructure edebilirsiniz (kullanmasanız bile)
          const { imageUrl, category, seller, ...productDataToPatch } = result.product;

          this.productForm.patchValue(productDataToPatch);
          this.productForm.get('category')?.setValue(category || null); // Kategori adını ata

          if (imageUrl) {
            this.productForm.get('imageUrl')?.setValue(imageUrl);
            this.imagePreviewUrl = imageUrl; // Mevcut resmi önizle
          } else {
            this.imagePreviewUrl = this.defaultImageUrl; // Mevcut resim yoksa varsayılanı göster
          }
          console.log('Düzenleme modu, form yüklendikten sonra active durumu:', this.productForm.get('active')?.value);
          console.log('Düzenleme modu, form yüklendikten sonra kategori:', this.productForm.get('category')?.value);
        } else if (this.isEditMode && !result.product) {
          console.error(`Düzenlenecek ürün ID ${this.productId} bulunamadı veya yüklenemedi.`);
          this.errorMessage = `Ürün ID ${this.productId} bulunamadı veya yüklenemedi.`;
        }
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message || 'Sayfa yüklenirken bir hata oluştu.';
        this.isLoading = false;
        console.error('Kategori veya ürün yüklenirken hata:', err);
      }
    });
  }

  // Form kontrollerine kolay erişim için getter'lar
  get name() { return this.productForm.get('name'); }
  get description() { return this.productForm.get('description'); }
  get price() { return this.productForm.get('price'); }
  get category() { return this.productForm.get('category'); }
  get type() { return this.productForm.get('type'); }
  get stockQuantity() { return this.productForm.get('stockQuantity'); }
  get active() { return this.productForm.get('active'); }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      console.log('Dosya seçildi:', this.selectedFile.name);
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
      this.productForm.get('imageUrl')?.setValue('');
    } else {
      this.selectedFile = null;
      const existingImageUrl = this.productForm.get('imageUrl')?.value;
      this.imagePreviewUrl = this.isEditMode && existingImageUrl ? existingImageUrl : this.defaultImageUrl;
    }
  }

  removeCurrentImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = this.defaultImageUrl;
    this.productForm.get('imageUrl')?.setValue('');
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    console.log('Mevcut/Seçilen resim kaldırıldı, varsayılan resim gösteriliyor.');
  }

  onSubmit(): void {
    this.successMessage = null;
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.errorMessage = "Lütfen formdaki tüm zorunlu alanları doğru bir şekilde doldurun.";
      console.warn('Form gönderilemedi, validasyon hataları var:', this.productForm.errors);
      Object.keys(this.productForm.controls).forEach(key => {
        const controlErrors = this.productForm.get(key)?.errors;
        if (controlErrors != null) {
          console.log('Kontrol Hataları ' + key + ':', controlErrors);
        }
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const productDataFromForm = this.productForm.value;

    // Bu productPayload, backend'deki ProductDto (istek DTO'su) ile uyumlu olmalı
    const productPayload = {
        name: productDataFromForm.name,
        description: productDataFromForm.description,
        price: typeof productDataFromForm.price === 'string' ? parseFloat(productDataFromForm.price) : productDataFromForm.price,
        category: productDataFromForm.category, // Seçilen kategori adı (string)
        type: productDataFromForm.type,
        imageUrl: productDataFromForm.imageUrl || null,
        stockQuantity: typeof productDataFromForm.stockQuantity === 'string' ? parseInt(productDataFromForm.stockQuantity, 10) : productDataFromForm.stockQuantity,
        active: productDataFromForm.active
    };

    console.log('Form gönderiliyor. Mod:', this.isEditMode ? 'Düzenleme' : 'Yeni', 'Payload (productDto için):', productPayload);

    const formData = new FormData();
    formData.append('productDto', new Blob([JSON.stringify(productPayload)], { type: 'application/json' }));

    if (this.selectedFile) {
      formData.append('imageFile', this.selectedFile, this.selectedFile.name);
      console.log('Resim dosyası FormData\'ya eklendi:', this.selectedFile.name);
    } else if (!productPayload.imageUrl && this.isEditMode) {
      console.log('Yeni resim dosyası seçilmedi ve mevcut resim URLsi de boş/null. Backend mevcut resmi silmeli (eğer varsa).');
    }

    // saveObservable'ın tipi ProductResponseDto olmalı
    let saveObservable: Observable<ProductResponseDto>;

    if (this.isEditMode && this.productId) {
      const numericProductId = Number(this.productId);
      // ApiService.updateSellerProduct metodunun Observable<ProductResponseDto> döndürdüğünü varsayıyoruz
      saveObservable = this.apiService.updateSellerProduct(numericProductId, formData);
    } else {
      // ApiService.createSellerProduct metodunun Observable<ProductResponseDto> döndürdüğünü varsayıyoruz
      saveObservable = this.apiService.createSellerProduct(formData);
    }

    this.submitSubscription?.unsubscribe();
    this.submitSubscription = saveObservable.subscribe({
      // savedProduct'ın tipi ProductResponseDto olmalı
      next: (savedProduct: ProductResponseDto) => {
        this.isLoading = false;
        this.successMessage = `Ürün başarıyla ${this.isEditMode ? 'güncellendi' : 'oluşturuldu'}!`;
        console.log('Ürün başarıyla kaydedildi/güncellendi:', savedProduct);
        if (!this.isEditMode) {
            this.productForm.reset({ active: true, category: null });
            this.selectedFile = null;
            this.imagePreviewUrl = this.defaultImageUrl;
            const fileInput = document.getElementById('imageFile') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } else {
            // Düzenleme modunda, ProductResponseDto'dan gelen imageUrl'i kullan
            if (savedProduct.imageUrl) {
                this.imagePreviewUrl = savedProduct.imageUrl;
                this.productForm.get('imageUrl')?.setValue(savedProduct.imageUrl);
            } else {
                this.imagePreviewUrl = this.defaultImageUrl;
                this.productForm.get('imageUrl')?.setValue('');
            }
            this.selectedFile = null;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        if (err.error && typeof err.error.message === 'string') {
            this.errorMessage = err.error.message;
        } else if (err.error && typeof err.error === 'string') {
            this.errorMessage = err.error;
        } else {
            this.errorMessage = err.message || `Ürün ${this.isEditMode ? 'güncellenirken' : 'oluşturulurken'} bir hata oluştu.`;
        }
        console.error('Ürün kaydetme/güncelleme hatası:', err);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  ngOnDestroy(): void {
    console.log('SellerProductFormComponent ngOnDestroy çağrıldı.');
    this.routeSubscription?.unsubscribe();
    this.submitSubscription?.unsubscribe();
  }
}
