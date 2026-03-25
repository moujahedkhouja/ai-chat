import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangePasswordComponent } from './change-password.component';
import { AuthService } from '../../auth/auth.service';
import { AuthResponse } from '../../models/auth.model';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['changePassword']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show error when passwords do not match', () => {
    component.form.setValue({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword2'
    });
    component.form.get('confirmPassword')?.markAsTouched();
    fixture.detectChanges();

    expect(component.form.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should navigate to dashboard on success', () => {
    const response: AuthResponse = { token: 'new-token', forcePasswordChange: false };
    authServiceSpy.changePassword.and.returnValue(of(response));

    component.form.setValue({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1'
    });
    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message on API failure', () => {
    authServiceSpy.changePassword.and.returnValue(
      throwError(() => ({ error: { error: 'Current password is incorrect' } }))
    );

    component.form.setValue({
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1'
    });
    component.onSubmit();

    expect(component.error).toBe('Current password is incorrect');
    expect(component.loading).toBeFalse();
  });
});
