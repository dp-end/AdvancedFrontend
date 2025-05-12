import { Routes } from '@angular/router';

// Mevcut Component importlarınız
import { UrunlerComponent } from './urunler/urunler.component';
import { SepetPageComponent } from './sepet-page/sepet-page.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrderHistoryComponent } from './order-history/order-history.component';

// Guard importları
import { AuthGuard } from './guards/auth.guard'; // Mevcut AuthGuard'ınız
import { AdminGuard } from './guards/admin.guard'; // Mevcut AdminGuard'ınız
import { sellerGuard } from './guards/seller.guard'; // SellerGuard import edildi

// Satıcı Paneli için Layout ve Alt Component importları
import { SellerLayoutComponent } from './seller-layout/seller-layout.component'; // Oluşturduğunuz layout component
import { SellerProductsComponent } from './seller-products/seller-products-component.component'; // Satıcının ürünlerini listeleme
import { SellerProductFormComponent } from './seller-product-form/seller-product-form.component'; // Ürün ekleme/düzenleme formu
import { SellerOrdersComponent } from './seller-order/seller-order.component'; // Satıcı Siparişleri Component'i

export const routes: Routes = [
  // --- Varsayılan ve Herkese Açık Rotalarınız ---
  { path: '', redirectTo: '/urunler', pathMatch: 'full' },
  { path: 'urunler', component: UrunlerComponent },
  { path: 'urun/:id', component: ProductDetailComponent },
  { path: 'cart', component: SepetPageComponent },

  // --- Kullanıcı Rotaları (Giriş Gerekli) ---
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [AuthGuard] // Sadece giriş yapmış kullanıcılar
  },
  {
    path: 'siparislerim',
    component: OrderHistoryComponent,
    canActivate: [AuthGuard] // Sadece giriş yapmış kullanıcılar
  },

  // --- Admin Rotalarınız (Mevcutsa) ---
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [AuthGuard, AdminGuard] // Hem giriş yapmış hem de admin olmalı
  },

  // --- Satıcı Paneli Rotaları (SellerGuard ile Korunmuş) ---
  {
    path: 'seller', // Ana satıcı yolu (örn: /seller)
    component: SellerLayoutComponent, // Bu path için SellerLayoutComponent'i yükle
    canActivate: [AuthGuard, sellerGuard], // YENİ: AuthGuard ve SellerGuard ana /seller rotasını korur
    // canActivateChild: [sellerGuard], // İsteğe bağlı: Tüm alt rotaları da bu guard ile korur
                                     // Eğer AuthGuard'ı burada da kullanmak isterseniz [AuthGuard, sellerGuard] şeklinde ekleyebilirsiniz.
    children: [
      // /seller path'ine gidildiğinde varsayılan olarak /seller/products'a yönlendir
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      {
        path: 'products', // /seller/products
        component: SellerProductsComponent
        // canActivate: [AuthGuard, sellerGuard] // Üstteki canActivateChild veya ana canActivate varsa buna genellikle gerek kalmaz
      },
      {
        path: 'products/new', // /seller/products/new
        component: SellerProductFormComponent
        // canActivate: [AuthGuard, sellerGuard]
      },
      {
        path: 'products/edit/:id', // /seller/products/edit/123 (dinamik ID ile)
        component: SellerProductFormComponent
        // canActivate: [AuthGuard, sellerGuard]
      },
      {
        path: 'orders', // /seller/orders
        component: SellerOrdersComponent
        // canActivate: [AuthGuard, sellerGuard]
      },
      // Gelecekte eklenecek diğer satıcı alt rotaları:
      // {
      //   path: 'profile',
      //   component: SellerProfileComponent // SellerProfileComponent'i import etmeniz gerekir
      //   // canActivate: [AuthGuard, sellerGuard]
      // },
    ]
  },

  // --- Eşleşmeyen Rotalar (En sonda olmalı) ---
  { path: '**', redirectTo: '/urunler' } // Bilinmeyen yolları ürünler sayfasına yönlendir
];
