import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService, UpdateUserRequest } from './user.service';
import { UserResponse, UserPage } from '../models/user.model';

const mockUser: UserResponse = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'USER',
  enabled: true,
  forcePasswordChange: false,
  profilePicturePath: null,
  linkedinUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get user by id', () => {
    service.getUser('1').subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('/api/users/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should update user', () => {
    const updateRequest: UpdateUserRequest = { linkedinUrl: 'https://linkedin.com/in/test' };

    service.updateUser('1', updateRequest).subscribe(user => {
      expect(user).toEqual({ ...mockUser, linkedinUrl: 'https://linkedin.com/in/test' });
    });

    const req = httpMock.expectOne('/api/users/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateRequest);
    req.flush({ ...mockUser, linkedinUrl: 'https://linkedin.com/in/test' });
  });

  it('should upload avatar', () => {
    const file = new File([''], 'avatar.png', { type: 'image/png' });

    service.uploadAvatar('1', file).subscribe(user => {
      expect(user).toEqual({ ...mockUser, profilePicturePath: 'avatars/avatar.png' });
    });

    const req = httpMock.expectOne('/api/users/1/avatar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({ ...mockUser, profilePicturePath: 'avatars/avatar.png' });
  });

  it('should list users with pagination', () => {
    const mockPage: UserPage = {
      content: [mockUser],
      page: {
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0
      }
    };

    service.listUsers(0, 20).subscribe(page => {
      expect(page).toEqual(mockPage);
    });

    const req = httpMock.expectOne('/api/users?page=0&size=20');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should POST to reset-password endpoint with newPassword', () => {
    service.adminResetPassword('user-1', 'newPassword123').subscribe();

    const req = httpMock.expectOne('/api/users/user-1/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ newPassword: 'newPassword123' });
    req.flush(null);
  });
});
