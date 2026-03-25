import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse, LoginRequest } from '../models/auth.model';

// Helper to create a fake JWT with given payload
function createFakeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'fakesig';
  return `${header}.${body}.${signature}`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login should POST to /api/auth/login and save token', () => {
    const loginRequest: LoginRequest = { username: 'testuser', password: 'password123' };
    const fakeToken = createFakeJwt({
      sub: '1',
      username: 'testuser',
      role: 'USER',
      forcePasswordChange: false,
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    const mockResponse: AuthResponse = { token: fakeToken, forcePasswordChange: false };

    service.login(loginRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(localStorage.getItem('auth_token')).toBe(fakeToken);
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(mockResponse);
  });

  it('logout should remove token from localStorage', () => {
    localStorage.setItem('auth_token', 'sometoken');
    service.logout();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('isLoggedIn should return false when no token', () => {
    localStorage.clear();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isForcePasswordChange should parse JWT claim correctly', () => {
    const fakeToken = createFakeJwt({
      sub: '1',
      username: 'testuser',
      role: 'USER',
      forcePasswordChange: true,
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    localStorage.setItem('auth_token', fakeToken);
    expect(service.isForcePasswordChange()).toBeTrue();
  });
});
