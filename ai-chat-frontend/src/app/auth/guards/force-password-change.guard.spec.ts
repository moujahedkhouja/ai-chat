import { TestBed } from '@angular/core/testing';
import { GuardResult, MaybeAsync, Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { forcePasswordChangeGuard } from './force-password-change.guard';
import { AuthService } from '../auth.service';

describe('forcePasswordChangeGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  function runGuard(): MaybeAsync<GuardResult> {
    return TestBed.runInInjectionContext(() => forcePasswordChangeGuard({} as any, {} as any));
  }

  it('should redirect to /change-password when forcePasswordChange is true', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(true);
    spyOn(authService, 'isForcePasswordChange').and.returnValue(true);
    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('change-password');
  });

  it('should allow navigation when forcePasswordChange is false', () => {
    spyOn(authService, 'isLoggedIn').and.returnValue(true);
    spyOn(authService, 'isForcePasswordChange').and.returnValue(false);
    const result = runGuard();
    expect(result).toBeTrue();
  });
});
