import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

// Modellerinizi ve DTO'larınızı import edin
import { User } from '../models/user.model'; // User modelinizin doğru yolunu belirtin
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { JwtAuthResponseDto } from '../dto/jwt-auth-response.dto';

// JWT decode kütüphanesi (örneğin jwt-decode)
// npm install jwt-decode
// import { jwtDecode } from 'jwt-decode'; // ES6 import
// Veya const jwt_decode = require('jwt-decode'); // CommonJS

// DecodedToken arayüzü, token'ınızın yapısına göre güncellenmelidir.
interface DecodedToken {
  sub: string; // Genellikle kullanıcı adı veya e-posta
  roles?: string[]; // Token'da roller string dizisi olarak geliyorsa
  authorities?: string[]; // Veya 'authorities' olarak geliyorsa
  userId?: number | string;
  firstName?: string;
  lastName?: string;
  iat: number;
  exp: number;
  // Token'ınızda bulunan diğer alanlar
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // Backend API adresiniz

  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  loggedIn$ = this.loggedIn.asObservable();

  private currentUser = new BehaviorSubject<User | null>(this.getUserFromToken());
  currentUser$ = this.currentUser.asObservable();

  private requestLoginModal = new BehaviorSubject<void | null>(null);
  requestLoginModal$ = this.requestLoginModal.asObservable();


  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('authToken'); // Token key'inizi kontrol edin
    }
    return false;
  }

  private getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  private getUserFromToken(): User | null {
    const token = this.getToken();
    if (token) {
      try {
        // GÜVENLİK UYARISI: atob() ve JSON.parse() ile JWT decode etmek üretim için önerilmez.
        // Güvenilir bir JWT decode kütüphanesi (örn: jwt-decode) kullanın veya
        // kullanıcı bilgilerini backend'den ayrı bir güvenli endpoint ile çekin.
        const payload: DecodedToken = JSON.parse(atob(token.split('.')[1]));

        // Token'dan gelen rolleri al (string dizisi olarak)
        const rolesFromToken: string[] = payload.roles || payload.authorities || [];

        // User modelinizin 'roles' özelliğinin string[] olduğunu varsayıyoruz.
        // Eğer User modelinizde roller {name: string}[] şeklinde ise,
        // aşağıdaki satırı roles: rolesFromToken.map(roleName => ({ name: roleName })) olarak değiştirin.
        return {
          id: payload.userId || 0,
          email: payload.sub,
          firstName: payload.firstName || '',
          lastName: payload.lastName || '',
          roles: rolesFromToken, // Roller string dizisi olarak atanıyor
          enabled: true
        } as User; // User modelinizin bu yapıya uygun olduğundan emin olun

      } catch (error) {
        console.error("Token decode edilemedi veya geçersiz:", error);
        this.clearTokenAndUser();
        return null;
      }
    }
    return null;
  }


  register(userData: RegisterDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(loginData: LoginDto): Observable<JwtAuthResponseDto> {
    return this.http.post<JwtAuthResponseDto>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          if (response && response.accessToken) {
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('authToken', response.accessToken);
            }
            this.loggedIn.next(true);
            this.currentUser.next(this.getUserFromToken());
            const user = this.currentUser.value;
            if (user && this.isAdmin(user)) {
                this.router.navigate(['/admin']);
            } else if (user && this.isSeller(user)) {
                this.router.navigate(['/seller']);
            } else {
                this.router.navigate(['/urunler']);
            }
          }
        }),
        catchError(err => {
          this.loggedIn.next(false);
          this.currentUser.next(null);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
    }
    this.loggedIn.next(false);
    this.currentUser.next(null);
    this.router.navigate(['/urunler']);
  }

  private clearTokenAndUser(): void {
     if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
    }
    this.loggedIn.next(false);
    this.currentUser.next(null);
  }

  isLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  getCurrentUser(): User | null {
    return this.currentUser.value;
  }

  // Kullanıcının satıcı olup olmadığını kontrol eden metot (DÜZELTİLDİ)
  isSeller(userToCheck?: User | null): boolean {
    const user = userToCheck || this.getCurrentUser();
    // User modelinizin 'roles' özelliğinin string[] olduğunu varsayıyoruz.
    // Eğer User modelinizde roller {name: string}[] şeklinde ise,
    // bu metodu user.roles.some(role => role.name === 'ROLE_SELLER') olarak değiştirin.
    if (user && user.roles && Array.isArray(user.roles)) {
      return user.roles.some(roleName => roleName === 'ROLE_SELLER');
    }
    return false;
  }

  // Admin olup olmadığını kontrol eden metot (DÜZELTİLDİ)
  isAdmin(userToCheck?: User | null): boolean {
    const user = userToCheck || this.getCurrentUser();
    // User modelinizin 'roles' özelliğinin string[] olduğunu varsayıyoruz.
    // Eğer User modelinizde roller {name: string}[] şeklinde ise,
    // bu metodu user.roles.some(role => role.name === 'ROLE_ADMIN') olarak değiştirin.
    if (user && user.roles && Array.isArray(user.roles)) {
      return user.roles.some(roleName => roleName === 'ROLE_ADMIN');
    }
    return false;
  }

  promptLogin(): void {
    this.requestLoginModal.next();
  }
}
