import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, FormBuilder, AbstractControl, ValidationErrors } from '@angular/forms'; // FormBuilder eklendi
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
// Doğru yerlerden importlar
import { AuthService } from '../services/auth.service';       // AuthService buradan
import { User } from '../models/user.model';                // <-- YOL GÜNCELLENDİ: Modelden
import { CartService } from '../services/cart.service';       // CartService buradan
import { LoginDto } from '../dto/login.dto';                // DTO'dan
import { RegisterDto } from '../dto/register.dto';            // DTO'dan

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  menuOpen = false;
  showRegisterForm = false;
  showLoginForm = false;
  isLoggedIn = false;
  currentUser: User | null = null;
  private authSubscription!: Subscription;
  private loginPromptSubscription: Subscription | null = null;

  registerError: string | null = null;
  loginError: string | null = null;

  registerForm: FormGroup; // FormGroup olarak tanımlandı
  loginForm: FormGroup;    // FormGroup olarak tanımlandı

  constructor(
    public authService: AuthService, // Template erişimi için public
    private cartService: CartService, // Kullanılmıyorsa kaldırılabilir
    private router: Router,
    private fb: FormBuilder // FormBuilder enjekte edildi
  ) {
    // Formları constructor içinde FormBuilder ile oluşturmak daha iyi bir pratiktir
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // confirmPassword: ['', Validators.required], // Eğer şifre tekrarı varsa
      registerAsSeller: [false] // Yeni FormControl, varsayılan değeri false
    }/*, { validators: this.passwordMatchValidator } */); // Şifre tekrarı validasyonu varsa

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.loggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      this.authService.currentUser$.subscribe(user => this.currentUser = user);
      if (status) { this.closeForms(); }
    });

    this.loginPromptSubscription = this.authService.requestLoginModal$.subscribe(() => {
      this.closeForms();
      this.openLogin();
    });
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.loginPromptSubscription?.unsubscribe();
  }

  // Şifre ve şifre tekrar alanlarının eşleşip eşleşmediğini kontrol eden custom validator
  // Eğer şifre tekrarı alanı formunuzda yoksa bu validatöre gerek yok.
  /*
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (confirmPassword === '' || password === confirmPassword) {
      return null;
    }
    return { passwordMismatch: true };
  }
  */

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMobileMenu(): void { if (this.menuOpen) { this.menuOpen = false; } }

  openRegister(): void {
    this.registerError = null;
    this.loginError = null;
    this.showRegisterForm = true;
    this.showLoginForm = false;
    this.registerForm.reset({ registerAsSeller: false }); // Formu sıfırla, registerAsSeller'ı false yap
  }
  openLogin(): void {
    this.loginError = null;
    this.registerError = null;
    this.showLoginForm = true;
    this.showRegisterForm = false;
    this.loginForm.reset();
  }
  closeForms(): void {
    this.showRegisterForm = false;
    this.showLoginForm = false;
    this.registerError = null;
    this.loginError = null;
  }

  onRegister(): void {
    this.registerError = null;
    if (this.registerForm.valid) {
      // RegisterDto'nuzla eşleşen bir nesne oluşturun
      const registerPayload: RegisterDto = {
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        registerAsSeller: this.registerForm.value.registerAsSeller // Checkbox değerini ekle
      };

      this.authService.register(registerPayload).subscribe({
        next: (response) => {
          console.log('Kayıt başarılı:', response);
          alert('Kayıt başarılı! Lütfen giriş yapın.');
          this.closeForms();
          this.openLogin(); // Kayıttan sonra login formunu aç
        },
        error: (err) => {
          this.registerError = err?.message || 'Bilinmeyen bir kayıt hatası oluştu.';
          console.error('Kayıt Hatası:', err.message, err);
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
      this.registerError = "Lütfen formdaki tüm zorunlu alanları doğru şekilde doldurun.";
    }
  }

  onLogin(): void {
    this.loginError = null;
    if (this.loginForm.valid) {
      const loginPayload: LoginDto = this.loginForm.value as LoginDto;
      this.authService.login(loginPayload).subscribe({
        next: (response) => {
          console.log('Giriş başarılı, token:', response.accessToken);
          this.closeForms();
          // Yönlendirme genellikle AuthService içinde yapılır veya burada yapılabilir:
          // this.router.navigate(['/']); // Ana sayfaya yönlendir
        },
        error: (err) => {
          this.loginError = err?.message || 'Bilinmeyen bir giriş hatası oluştu.';
          console.error('Login Hatası:', err.message, err);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
      this.loginError = "Lütfen e-posta ve şifrenizi girin.";
    }
  }

  onLogout(): void {
    this.authService.logout();
    // Çıkış yapıldıktan sonra ana sayfaya veya ürünler sayfasına yönlendirme
    this.router.navigate(['/urunler']);
  }
}
