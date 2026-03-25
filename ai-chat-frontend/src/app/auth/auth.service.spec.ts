import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { CurrentUser, LoginRequest } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: CurrentUser = {
    userId: '123',
    username: 'testuser',
    role: 'USER',
    forcePasswordChange: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login should POST to /api/auth/login and update currentUser', () => {
    const loginRequest: LoginRequest = { username: 'testuser', password: 'password123' };

    service.login(loginRequest).subscribe(user => {
      expect(user).toEqual(mockUser);
      expect(service.getCurrentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(mockUser);
  });

  it('logout should POST to /api/auth/logout and clear currentUser', () => {
    // Set up a logged-in state first
    (service as any).currentUserSubject.next(mockUser);
    expect(service.isLoggedIn()).toBeTrue();

    service.logout().subscribe(() => {
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });

    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('isLoggedIn should return false when no currentUser', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('loadCurrentUser should call /api/auth/me and populate currentUser', () => {
    service.loadCurrentUser().subscribe(user => {
      expect(user).toEqual(mockUser);
      expect(service.getCurrentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
    });

    const req = httpMock.expectOne('/api/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('loadCurrentUser should set currentUser to null on 401', () => {
    service.loadCurrentUser().subscribe(user => {
      expect(user).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });

    const req = httpMock.expectOne('/api/auth/me');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('isForcePasswordChange should return true when currentUser has forcePasswordChange', () => {
    (service as any).currentUserSubject.next({ ...mockUser, forcePasswordChange: true });
    expect(service.isForcePasswordChange()).toBeTrue();
  });

  it('getRole should return role from currentUser', () => {
    (service as any).currentUserSubject.next(mockUser);
    expect(service.getRole()).toBe('USER');
  });

  it('getUsername should return username from currentUser', () => {
    (service as any).currentUserSubject.next(mockUser);
    expect(service.getUsername()).toBe('testuser');
  });

  it('getUserId should return userId from currentUser', () => {
    (service as any).currentUserSubject.next(mockUser);
    expect(service.getUserId()).toBe('123');
  });
});
