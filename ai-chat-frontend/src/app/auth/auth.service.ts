import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, of, tap } from 'rxjs';
import { LoginRequest, ChangePasswordRequest, CurrentUser } from '../models/auth.model';
import { UserResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<CurrentUser | null>(null);
  currentUser$ = toObservable(this.currentUser);

  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly role = computed(() => this.currentUser()?.role ?? null);
  readonly userId = computed(() => this.currentUser()?.userId ?? null);
  readonly username = computed(() => this.currentUser()?.username ?? null);
  readonly hasAvatar = computed(() => this.currentUser()?.hasAvatar ?? false);
  readonly forcePasswordChange = computed(() => this.currentUser()?.forcePasswordChange ?? false);

  get currentUserValue(): CurrentUser | null {
    return this.currentUser();
  }

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<CurrentUser> {
    return this.http.post<CurrentUser>('/api/auth/login', request)
      .pipe(tap(user => {
        this.currentUser.set(user);
      }));
  }

  changePassword(request: ChangePasswordRequest): Observable<CurrentUser> {
    return this.http.post<CurrentUser>('/api/auth/change-password', request)
      .pipe(tap(user => {
        this.currentUser.set(user);
      }));
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {})
      .pipe(tap(() => {
        this.currentUser.set(null);
      }));
  }

  loadCurrentUser(): Observable<CurrentUser | null> {
    return this.http.get<CurrentUser>('/api/auth/me').pipe(
      tap(user => {
        this.currentUser.set(user);
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      })
    );
  }

  // Backward compatibility wrappers for consumers/tests
  isForcePasswordChange(): boolean {
    return this.forcePasswordChange();
  }

  // Deprecated: prefer using `role()`
  getRole(): string | null {
    return this.role();
  }

  // Deprecated: prefer using `userId()`
  getUserId(): string | null {
    return this.userId();
  }

  // Deprecated: prefer using `username()`
  getUsername(): string | null {
    return this.username();
  }

  // Deprecated: prefer using `currentUser()`
  getCurrentUser(): CurrentUser | null {
    return this.currentUser();
  }

  getAvatarUrl(userId?: string | null, hasAvatar?: boolean | null): string | null {
    if (!hasAvatar || !userId) return null;
    return `/api/users/${userId}/avatar`;
  }

  refreshFromProfile(user: UserResponse): void {
    const current = this.currentUser();
    if (current) {
      const updated = {
        ...current,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        hasAvatar: user.hasAvatar
      };
      this.currentUser.set(updated);
    }
  }
}
