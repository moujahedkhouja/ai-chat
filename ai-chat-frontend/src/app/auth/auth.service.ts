import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { LoginRequest, ChangePasswordRequest, CurrentUser } from '../models/auth.model';
import { UserResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  currentUserSignal = signal<CurrentUser | null>(null);

  get currentUserValue(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<CurrentUser> {
    return this.http.post<CurrentUser>('/api/auth/login', request)
      .pipe(tap(user => {
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
      }));
  }

  changePassword(request: ChangePasswordRequest): Observable<CurrentUser> {
    return this.http.post<CurrentUser>('/api/auth/change-password', request)
      .pipe(tap(user => {
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
      }));
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {})
      .pipe(tap(() => {
        this.currentUserSubject.next(null);
        this.currentUserSignal.set(null);
      }));
  }

  loadCurrentUser(): Observable<CurrentUser | null> {
    return this.http.get<CurrentUser>('/api/auth/me').pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        this.currentUserSignal.set(null);
        return of(null);
      })
    );
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isForcePasswordChange(): boolean {
    return this.currentUserSubject.value?.forcePasswordChange ?? false;
  }

  getRole(): string | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  getUserId(): string | null {
    return this.currentUserSubject.value?.userId ?? null;
  }

  getUsername(): string | null {
    return this.currentUserSubject.value?.username ?? null;
  }

  getProfilePicturePath(): string | null {
    return this.currentUserSubject.value?.profilePicturePath ?? null;
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  getAvatarUrl(userId?: string | null, path?: string | null): string | null {
    if (!path || !userId) return null;
    return `/api/users/${userId}/avatar`;
  }

  refreshFromProfile(user: UserResponse): void {
    const current = this.currentUserSubject.value;
    if (current) {
      const updated = {
        ...current,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicturePath: user.profilePicturePath
      };
      this.currentUserSubject.next(updated);
      this.currentUserSignal.set(updated);
    }
  }
}
