import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  TokenPayload,
  CaptchaResponse,
} from '../api/models/auth.models';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/${environment.apiVersion}`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'current_user';
  private readonly REMEMBER_KEY = 'remember_me';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // RBAC state
  private userRoles: string[] = [];
  private userPermissions: string[] = [];

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const token = this.getToken();
    const user = this.getStoredUser();
    const rememberMe = this.getRememberMe();

    if (token && user && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      this.decodeTokenAndSetRoles(token);
    } else if (!rememberMe) {
      // Clear session data if not remembering
      this.clearSessionData();
    } else {
      this.clearAuthData();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Use FormData to match OAuth2PasswordRequestForm format
    const formData = new FormData();
    formData.append('username', credentials.email); // FastAPI expects 'username' field
    formData.append('password', credentials.password);

    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/token`, formData)
      .pipe(
        tap((response) => {
          this.setAuthData(
            response.access_token,
            response.user,
            credentials.remember_me || false
          );

          this.decodeTokenAndSetRoles(response.access_token);
        })
      );
  }

  // register(userData: RegisterRequest): Observable<AuthResponse> {
  //   return this.http
  //     .post<AuthResponse>(`${this.API_URL}/auth/register`, userData)
  //     .pipe(
  //       tap((response) => {
  //         this.setAuthData(response.access_token, response.user, true);
  //         this.decodeTokenAndSetRoles(response.access_token);
  //       })
  //     );
  // }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap({
          next: (response) => {
            // Check if response has the expected structure
            if (!response.access_token) {
              console.error(
                'No access_token in registration response:',
                response
              );
              throw new Error(
                'Registration successful but no access token received'
              );
            }

            if (!response.user) {
              console.error('No user data in registration response:', response);
              throw new Error(
                'Registration successful but no user data received'
              );
            }

            this.setAuthData(response.access_token, response.user, true);
            this.decodeTokenAndSetRoles(response.access_token);
          },
          error: (error) => {
            console.error('Registration API Error:', error);
          },
        })
      );
  }

  logout(): void {
    this.clearAuthData();
    this.userRoles = [];
    this.userPermissions = [];
    this.router.navigate(['/']);
  }

  // CAPTCHA methods
  getCaptcha(): Observable<CaptchaResponse> {
    return this.http.get<CaptchaResponse>(`${this.API_URL}/auth/captcha/`);
  }

  verifyCaptcha(
    captchaId: string,
    captchaText: string
  ): Observable<{ valid: boolean; message: string }> {
    const params = {
      captcha_id: captchaId,
      user_input: captchaText,
    };

    return this.http.post<{ valid: boolean; message: string }>(
      `${this.API_URL}/auth/captcha/validate`,
      null, // Empty body as shown in curl example
      { params } // Pass parameters as query params
    );
  }

  // RBAC Methods
  hasRole(role: string): boolean {
    return this.userRoles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.userRoles.includes(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => this.userRoles.includes(role));
  }

  hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) =>
      this.userPermissions.includes(permission)
    );
  }

  getRoles(): string[] {
    return [...this.userRoles];
  }

  getPermissions(): string[] {
    return [...this.userPermissions];
  }

  // Token methods
  getToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  private setAuthData(token: string, user: User, rememberMe: boolean): void {
    // Clear existing data
    this.clearAuthData();

    if (rememberMe) {
      // Store in localStorage for persistent login
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.REMEMBER_KEY, 'true');
    } else {
      // Store in sessionStorage for session-only login
      sessionStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.REMEMBER_KEY, 'false');
    }

    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private clearSessionData(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  private getStoredUser(): User | null {
    const userStr =
      localStorage.getItem(this.USER_KEY) ||
      sessionStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private getRememberMe(): boolean {
    const remember = localStorage.getItem(this.REMEMBER_KEY);
    return remember === 'true';
  }

  private decodeTokenAndSetRoles(token: string): void {
    try {
      const payload: TokenPayload = jwtDecode(token);
      this.userRoles = payload.roles || [];
      this.userPermissions = payload.permissions || [];
    } catch (error) {
      console.error('Error decoding token:', error);
      this.userRoles = [];
      this.userPermissions = [];
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload: TokenPayload = jwtDecode(token);
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  getTokenExpiration(): Date | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload: TokenPayload = jwtDecode(token);
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  // Check if user can access specific features
  canAccessQueryPage(): boolean {
    return (
      this.hasPermission('query:execute') ||
      this.hasRole('admin') ||
      this.hasRole('researcher')
    );
  }

  canExportData(): boolean {
    return this.hasPermission('data:export') || this.hasRole('admin');
  }

  canManageUsers(): boolean {
    return this.hasPermission('users:manage') || this.hasRole('admin');
  }
}
