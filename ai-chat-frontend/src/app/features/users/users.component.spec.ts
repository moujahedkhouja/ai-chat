import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { UsersComponent } from './users.component';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse, UserPage } from '../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

const mockUser: UserResponse = {
  id: '1',
  username: 'admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  enabled: true,
  forcePasswordChange: false,
  profilePicturePath: null,
  linkedinUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockPage: UserPage = {
  content: [mockUser],
  page: {
    totalElements: 1,
    totalPages: 1,
    size: 20,
    number: 0
  }
};

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getAvatarUrl'], {
      role: signal('ADMIN'),
      username: signal('admin')
    });
    userServiceSpy = jasmine.createSpyObj('UserService', ['listUsers', 'deleteUser', 'createUser', 'updateUser', 'adminResetPassword']);

    userServiceSpy.listUsers.and.returnValue(of(mockPage));

    await TestBed.configureTestingModule({
      imports: [UsersComponent, TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load users on init', () => {
    expect(userServiceSpy.listUsers).toHaveBeenCalledWith(0, 20);
    expect(component.users()).toEqual([mockUser]);
    expect(component.totalElements()).toBe(1);
    expect(component.totalPages()).toBe(1);
    expect(component.errorMessage()).toBe('');
  });

  it('should show create form when isAdmin and button clicked', () => {
    expect(component.isAdmin()).toBeTrue();
    expect(component.showCreateForm()).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    const createButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
    expect(createButton).toBeTruthy();
    expect(createButton.textContent?.trim()).toContain('users.new');

    createButton.click();
    fixture.detectChanges();

    expect(component.showCreateForm()).toBeTrue();
    expect(compiled.querySelector('app-create-user-dialog')).toBeTruthy();
  });

  describe('edit flow', () => {
    it('onEditUser sets userToEdit', () => {
      component.onEditUser(mockUser);

      expect(component.userToEdit()).toBe(mockUser);
    });

    it('onUserUpdated closes modal and reloads', () => {
      component.onEditUser(mockUser);

      component.onUserUpdated();

      expect(component.userToEdit()).toBeNull();
      expect(userServiceSpy.listUsers).toHaveBeenCalledTimes(2);
    });
  });
});
