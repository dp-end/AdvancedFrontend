import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Routes } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { UrunlerComponent } from './urunler/urunler.component';
import { CartComponent } from './cart/cart.component';

// Routing yapılandırması
const routes: Routes = [
  { path: 'urunler', component: UrunlerComponent },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    UrunlerComponent,
    RouterOutlet,
    CartComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chimax';
}
