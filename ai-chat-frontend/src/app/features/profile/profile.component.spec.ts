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
    authServiceSpy = jasmine.createSpyObj('AuthService', ['refreshFromProfile', 'changePassword']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getProfile', 'updateProfile', 'uploadAvatar']);

    userServiceSpy.getProfile.and.returnValue(of(mockUser));

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
    expect(userServiceSpy.getProfile).toHaveBeenCalled();
    expect(component.user).toEqual(mockUser);
    expect(component.infoForm.value.username).toBe('testuser');
    expect(component.infoForm.value.email).toBe('test@example.com');
    expect(component.infoError).toBe('');
  });

  it('should show success message on save info', () => {
    const updatedUser: UserResponse = {
      ...mockUser,
      username: 'updateduser'
    };
    userServiceSpy.updateProfile.and.returnValue(of(updatedUser));

    component.infoForm.patchValue({ username: 'updateduser', email: 'updated@example.com' });
    component.onSaveInfo();

    expect(userServiceSpy.updateProfile).toHaveBeenCalledWith({
      username: 'updateduser',
      email: 'updated@example.com'
    });
    expect(component.infoSuccess).toBe('Profile updated');
    expect(component.user).toEqual(updatedUser);
    expect(component.infoLoading).toBeFalse();
  });
});
