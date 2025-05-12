import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormsModule } from '@angular/forms'; // FormsModule EKLENDİ
import { Observable, Subscription, firstValueFrom, of } from 'rxjs';
import { switchMap, catchError, finalize, tap } from 'rxjs/operators';
import { CartService, CartItem } from '../services/cart.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { CreatePaymentIntentResponseDto } from '../dto/create-payment-intent-response.dto';
import { CreatePaymentIntentRequestDto } from '../dto/create-payment-intent-request.dto';
import { HttpErrorResponse } from '@angular/common/http';

export interface OrderCreationResponseDto {
  orderId: number | string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // FormsModule EKLENDİ (ngModel için)
    RouterLink
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('stripeCardElement') stripeCardElementRef!: ElementRef;

  cartItems$: Observable<CartItem[]>;
  totalPrice = 0;
  isSubmitting = false;
  private cartSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  currentUser: User | null = null;

  addressForm = new FormGroup({
    fullName: new FormControl('', Validators.required),
    addressLine1: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
    postalCode: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{5}$')]),
    country: new FormControl({ value: 'Türkiye', disabled: true }, Validators.required),
    phone: new FormControl('', [Validators.required, Validators.pattern('^[0-9\\s\\-\\+]{10,}$')]),
  });
  selectedPaymentMethod: 'stripe' | 'paypal' | null = null;

  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  cardElement: StripeCardElement | null = null;
  stripeClientSecret: string | null = null;
  isPaymentProcessing = false;
  paymentError: string | null = null;
  stripePublishableKey = 'pk_test_51RLSbJ4FTNpFSwUWBfsSSqnKbbJulAy21zaptceB403Z4RkYlN12t9n9OX2UPUndVqbyQUqCjxzMdHE0dWx93bBT00SPqwgwHP'; // KENDİ ANAHTARINI YAZ

  constructor(
    public cartService: CartService,
    private apiService: ApiService,
    private router: Router,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.cartItems$ = this.cartService.cartItems$;
  }

  async ngOnInit(): Promise<void> {
    this.authSubscription = this.authService.currentUser$.subscribe(user => this.currentUser = user);

    this.cartSubscription = this.cartService.cartItems$.subscribe(items => {
      // TS18047 Hatası için Düzeltme:
      this.totalPrice = items.reduce((sum, item) => {
        const price = item.price ?? 0; // item.price null ise 0 kullan
        const quantity = item.quantity ?? 0; // item.quantity null ise 0 kullan
        return sum + (price * quantity);
      }, 0);
      if (items.length === 0 && isPlatformBrowser(this.platformId) && this.router.url.includes('/checkout')) {
        console.warn('Checkout boş sepetle yüklendi, sepete yönlendiriliyor.');
        this.router.navigate(['/cart']);
      }
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.stripePublishableKey.startsWith('pk_test_')) { console.warn('Stripe Key Eksik/Yanlış!'); }
      try {
        console.log("Stripe yükleniyor...");
        this.stripe = await loadStripe(this.stripePublishableKey);
        if (this.stripe) {
          this.elements = this.stripe.elements();
          console.log("Stripe ve Elements başarıyla yüklendi.");
        } else { this.handlePaymentError("Ödeme sistemi yüklenemedi (Stripe null)."); }
      } catch (error) { this.handlePaymentError("Ödeme sistemi başlatılırken hata.", error); }
    }
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.cardElement?.destroy();
  }

  onPaymentMethodChange(): void {
    this.paymentError = null;
    if (this.selectedPaymentMethod === 'stripe' && isPlatformBrowser(this.platformId)) {
      if (this.stripe && this.elements) {
        setTimeout(() => this.mountStripeCardElement(), 50);
      } else {
        this.handlePaymentError("Ödeme alanı yüklenemedi. Lütfen sayfayı yenileyin.");
      }
    } else {
      this.unmountStripeCardElement();
    }
  }

  mountStripeCardElement(): void {
    if (!this.elements || !this.stripeCardElementRef?.nativeElement) {
      this.handlePaymentError("Kredi kartı alanı oluşturulamadı."); return;
    }
    if (this.cardElement) { return; }

    console.log("Stripe Card Element mount ediliyor...");
    this.cardElement = this.elements.create('card', { /* stil ayarları */ });
    this.cardElement.mount(this.stripeCardElementRef.nativeElement);
    this.cardElement.on('change', (event) => {
      this.paymentError = event.error ? event.error.message : null;
      this.cd.detectChanges();
    });
    console.log('Stripe Card Element başarıyla mount edildi.');
  }

  unmountStripeCardElement(): void {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement.destroy();
      this.cardElement = null;
      console.log('Stripe Card Element başarıyla unmount edildi.');
    }
  }

  private handlePaymentError(message: string, error?: any) {
    console.error("Ödeme Hatası:", message, error);
    this.paymentError = message;
    this.isSubmitting = false;
    this.isPaymentProcessing = false;
    this.cd.detectChanges();
  }

  async startCheckoutProcess(): Promise<void> {
    this.paymentError = null;
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      this.handlePaymentError('Lütfen teslimat adresini eksiksiz doldurun.');
      return;
    }
    if (!this.selectedPaymentMethod) {
      this.handlePaymentError('Lütfen bir ödeme yöntemi seçin.');
      return;
    }

    this.isSubmitting = true;

    if (this.selectedPaymentMethod === 'stripe') {
      if (!this.stripe || !this.cardElement) {
        this.handlePaymentError('Stripe ödeme sistemi veya kart alanı hazır değil.'); return;
      }
      this.isPaymentProcessing = true;

      const paymentIntentRequest: CreatePaymentIntentRequestDto = {
        amount: Math.round(this.totalPrice * 100),
        currency: 'try'
      };

      this.apiService.post<CreatePaymentIntentResponseDto>('payments/create-intent', paymentIntentRequest)
        .pipe(
          catchError((err: HttpErrorResponse) => {
            this.handlePaymentError(`Ödeme başlatılamadı: ${err.message || 'Sunucu hatası'}`, err);
            return of(null);
          }),
          finalize(() => {
            if (!this.stripeClientSecret && this.isPaymentProcessing) {
              this.isPaymentProcessing = false;
              this.isSubmitting = false;
            }
          })
        )
        .subscribe((response: CreatePaymentIntentResponseDto | null) => {
          if (response && response.clientSecret) {
            this.stripeClientSecret = response.clientSecret;
            this.confirmPaymentWithStripe();
          } else if (!this.paymentError) {
            this.handlePaymentError('Ödeme başlatılamadı (client secret alınamadı).');
          }
        });

    } else if (this.selectedPaymentMethod === 'paypal') {
      this.handlePaymentError('PayPal entegrasyonu henüz tamamlanmadı.');
      this.isSubmitting = false;
    } else {
      this.handlePaymentError('Geçersiz ödeme yöntemi seçildi.');
      this.isSubmitting = false;
    }
  }

  async confirmPaymentWithStripe(): Promise<void> {
    if (!this.stripe || !this.cardElement || !this.stripeClientSecret) {
      this.handlePaymentError("Ödeme sistemi hatası (Stripe, CardElement veya ClientSecret eksik).");
      this.isSubmitting = false;
      return;
    }
    console.log('Stripe ödemesi onaylanıyor...');
    try {
      const billingDetails = {
        name: this.addressForm.value.fullName || undefined,
        email: this.currentUser?.email || undefined,
        phone: this.addressForm.value.phone || undefined,
        address: {
          line1: this.addressForm.value.addressLine1 || undefined,
          city: this.addressForm.value.city || undefined,
          postal_code: this.addressForm.value.postalCode || undefined,
          country: 'TR',
        },
      };
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(this.stripeClientSecret, {
        payment_method: { card: this.cardElement, billing_details: billingDetails },
      });

      if (error) {
        this.handlePaymentError(error.message || "Ödeme sırasında hata.", error);
        this.isSubmitting = false;
      } else {
        if (paymentIntent?.status === 'succeeded') {
          console.log('Ödeme başarılı! Sipariş sonlandırılıyor...');
          await this.finalizeOrder(paymentIntent.id);
        } else {
          this.handlePaymentError(`Ödeme durumu beklenmedik: ${paymentIntent?.status}`);
          this.isSubmitting = false;
        }
      }
    } catch (error) {
      this.handlePaymentError("Ödeme onayı sırasında beklenmedik hata.", error);
      this.isSubmitting = false;
    }
  }

  async finalizeOrder(paymentIntentId: string): Promise<void> {
    console.log('Sipariş backend\'e kaydediliyor, PaymentIntent ID:', paymentIntentId);
    const currentCartItems = await firstValueFrom(this.cartItems$);
    const orderData = {
      shippingAddress: this.addressForm.getRawValue(),
      paymentMethod: this.selectedPaymentMethod,
      paymentIntentId: paymentIntentId,
      items: currentCartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: this.totalPrice
    };

    this.apiService.post<OrderCreationResponseDto>('orders', orderData)
      .pipe(finalize(() => {
        this.isPaymentProcessing = false;
        this.isSubmitting = false;
      }))
      .subscribe({
        next: (response: OrderCreationResponseDto) => {
          console.log('Sipariş başarıyla oluşturuldu:', response);
          this.cartService.clearCart();
          alert(`Siparişiniz başarıyla oluşturuldu! Sipariş ID: ${response?.orderId || 'N/A'}`);
          this.router.navigate(['/siparislerim']);
        },
        error: (err: HttpErrorResponse) => {
          this.handlePaymentError(`ÖDEME ALINDI ANCAK SİPARİŞ KAYDEDİLİRKEN HATA! Lütfen destek ile iletişime geçin. Referans: ${paymentIntentId}. Hata: ${err?.message || 'Sunucu hatası.'}`, err);
        }
      });
  }

  get fullName() { return this.addressForm.get('fullName'); }
  get addressLine1() { return this.addressForm.get('addressLine1'); }
  get city() { return this.addressForm.get('city'); }
  get postalCode() { return this.addressForm.get('postalCode'); }
  get phone() { return this.addressForm.get('phone'); }
}
