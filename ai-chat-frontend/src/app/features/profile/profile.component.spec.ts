import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse } from '../../models/user.model';

const mockUser: UserResponse = {
  id: '42',
  username: 'testuser',
  email: 'test@example.com',
  role: 'USER',
  enabled: true,
  forcePasswordChange: false,
  profilePicturePath: null,
  linkedinUrl: 'https://linkedin.com/in/testuser',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUser', 'updateUser', 'uploadAvatar']);

    authServiceSpy.getUserId.and.returnValue('42');
    userServiceSpy.getUser.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load and display user profile on init', () => {
    expect(userServiceSpy.getUser).toHaveBeenCalledWith('42');
    expect(component.user).toEqual(mockUser);
    expect(component.form.value.linkedinUrl).toBe('https://linkedin.com/in/testuser');
    expect(component.errorMessage).toBe('');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.value')?.textContent?.trim()).toBe('testuser');
  });

  it('should show success message on save', () => {
    const updatedUser: UserResponse = {
      ...mockUser,
      linkedinUrl: 'https://linkedin.com/in/updated'
    };
    userServiceSpy.updateUser.and.returnValue(of(updatedUser));

    component.form.patchValue({ linkedinUrl: 'https://linkedin.com/in/updated' });
    component.onSave();

    expect(userServiceSpy.updateUser).toHaveBeenCalledWith('42', {
      linkedinUrl: 'https://linkedin.com/in/updated'
    });
    expect(component.successMessage).toBe('Profile updated successfully');
    expect(component.user).toEqual(updatedUser);
    expect(component.loading).toBeFalse();
  });
});
