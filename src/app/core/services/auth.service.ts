import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'cfdi_token';
  private currentUser$ = new BehaviorSubject<AuthUser | null>(this.loadUserFromToken());

  constructor(private http: HttpClient, private router: Router) {}

  get user$(): Observable<AuthUser | null> {
    return this.currentUser$.asObservable();
  }

  get currentUser(): AuthUser | null {
    return this.currentUser$.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        sessionStorage.setItem(this.TOKEN_KEY, res.token);
        this.currentUser$.next(res.user);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('cfdi_erp_api_url');  // limpieza de clave legacy
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    if (this.isTokenExpired(token)) {
      sessionStorage.removeItem(this.TOKEN_KEY);
      this.currentUser$.next(null);
      return null;
    }
    return token;
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentUser?.role ?? '');
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;  // token malformado se trata como expirado
    }
  }

  private loadUserFromToken(): AuthUser | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (this.isTokenExpired(token)) {
        sessionStorage.removeItem(this.TOKEN_KEY);
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}
