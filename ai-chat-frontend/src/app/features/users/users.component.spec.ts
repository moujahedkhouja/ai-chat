import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UsersComponent } from './users.component';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse, UserPage } from '../../models/user.model';

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
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getRole']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['listUsers', 'deleteUser', 'createUser', 'updateUser']);

    authServiceSpy.getRole.and.returnValue('ADMIN');
    userServiceSpy.listUsers.and.returnValue(of(mockPage));

    await TestBed.configureTestingModule({
      imports: [UsersComponent],
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
    expect(component.users).toEqual([mockUser]);
    expect(component.totalElements).toBe(1);
    expect(component.totalPages).toBe(1);
    expect(component.errorMessage).toBe('');
  });

  it('should show create form when isAdmin and button clicked', () => {
    expect(component.isAdmin).toBeTrue();
    expect(component.showCreateForm).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    const createButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;
    expect(createButton).toBeTruthy();
    expect(createButton.textContent?.trim()).toContain('New User');

    createButton.click();
    fixture.detectChanges();

    expect(component.showCreateForm).toBeTrue();
    expect(compiled.querySelector('app-create-user-dialog')).toBeTruthy();
  });

  describe('edit-username flow', () => {
    it('onEditUsername opens modal with current username value', () => {
      component.onEditUsername(mockUser);

      expect(component.userToEditUsername).toBe(mockUser);
      expect(component.editUsernameValue).toBe(mockUser.username);
      expect(component.editUsernameError).toBe('');
    });

    it('confirmEditUsername success closes modal and reloads', () => {
      userServiceSpy.updateUser.and.returnValue(of(mockUser));
      component.onEditUsername(mockUser);
      component.editUsernameValue = 'newname';

      component.confirmEditUsername();

      expect(userServiceSpy.updateUser).toHaveBeenCalledWith(mockUser.id, { username: 'newname' });
      expect(component.userToEditUsername).toBeNull();
      expect(component.editUsernameLoading).toBeFalse();
      expect(userServiceSpy.listUsers).toHaveBeenCalledTimes(2);
    });

    it('confirmEditUsername 409 shows taken error', () => {
      userServiceSpy.updateUser.and.returnValue(throwError(() => ({ status: 409 })));
      component.onEditUsername(mockUser);
      component.editUsernameValue = 'taken';

      component.confirmEditUsername();

      expect(component.editUsernameError).toBe('Username is already taken');
      expect(component.editUsernameLoading).toBeFalse();
      expect(component.userToEditUsername).toBe(mockUser);
    });

    it('confirmEditUsername other error shows generic error', () => {
      userServiceSpy.updateUser.and.returnValue(throwError(() => ({ status: 500 })));
      component.onEditUsername(mockUser);
      component.editUsernameValue = 'newname';

      component.confirmEditUsername();

      expect(component.editUsernameError).toBe('Failed to update username');
      expect(component.editUsernameLoading).toBeFalse();
      expect(component.userToEditUsername).toBe(mockUser);
    });
  });
});
