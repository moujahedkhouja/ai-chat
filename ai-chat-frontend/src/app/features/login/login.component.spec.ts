import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../auth/auth.service';
import { CurrentUser } from '../../models/auth.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display error on login failure', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Unauthorized')));

    component.form.setValue({ username: 'user', password: 'wrong' });
    component.onSubmit();

    expect(component.error).toBe('Invalid username or password');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to dashboard on successful login (forcePasswordChange=false)', () => {
    const response: CurrentUser = { userId: '1', username: 'user', role: 'USER', forcePasswordChange: false };
    authServiceSpy.login.and.returnValue(of(response));

    component.form.setValue({ username: 'user', password: 'pass' });
    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
