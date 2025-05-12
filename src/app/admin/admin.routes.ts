import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageProductsComponent } from './manage-products/manage-products.component';
import { AddProductComponent } from './add-product/add-product.component'; // Mevcut component
import { ManageOrdersComponent } from './manage-orders/manage-orders.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { ManageMessagesComponent } from './manage-messages/manage-messages.component'; // Mevcut component

// Admin paneli içindeki rotalar
export const ADMIN_ROUTES: Routes = [
  {
    // Ana admin yolu (/admin) AdminLayoutComponent'i yükler
    path: '', // /admin'e gelindiğinde bu component çalışacak
    component: AdminLayoutComponent,
    children: [ // AdminLayout içindeki <router-outlet>'e yüklenecek alt rotalar
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // /admin boşsa dashboard'a yönlendir
      { path: 'dashboard', component: DashboardComponent }, // /admin/dashboard
      { path: 'products', component: ManageProductsComponent }, // /admin/products (Ürünleri listeleme/yönetme)
      { path: 'products/add', component: AddProductComponent }, // /admin/products/add (Yeni ürün ekleme)
      { path: 'products/edit/:id', component: AddProductComponent }, // /admin/products/edit/123 (Ürün düzenleme - aynı formu kullanabilir)
      { path: 'orders', component: ManageOrdersComponent }, // /admin/orders
      { path: 'users', component: ManageUsersComponent }, // /admin/users
      { path: 'messages', component: ManageMessagesComponent }, // /admin/messages (İletişim mesajları yönetimi)
      // Buraya başka admin sayfaları eklenebilir
    ]
  }
];
