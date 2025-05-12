// src/app/seller-admin/seller-layout/seller-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router'; // RouterOutlet'i import edin
import { SellerSidebarComponent } from '../seller-sidebar/seller-sidebar.component'; // SellerSidebarComponent'i import edin

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, // RouterOutlet'i imports dizisine ekleyin
    SellerSidebarComponent // SellerSidebarComponent'i imports dizisine ekleyin
  ],
  templateUrl: './seller-layout.component.html',
  styleUrls: ['./seller-layout.component.scss']
})
export class SellerLayoutComponent {
  // Gelecekte satıcı paneliyle ilgili genel mantık veya veri buraya eklenebilir.
  constructor() {}
}
