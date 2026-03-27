import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditUserDialogComponent } from './edit-user-dialog.component';
import { UserService } from '../../../core/user.service';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { UserResponse } from '../../../models/user.model';
import { signal } from '@angular/core';

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

describe('EditUserDialogComponent', () => {
  let component: EditUserDialogComponent;
  let fixture: ComponentFixture<EditUserDialogComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['updateUser', 'adminResetPassword']);

    await TestBed.configureTestingModule({
      imports: [EditUserDialogComponent, TranslateModule.forRoot()],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditUserDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('user', mockUser);
    fixture.detectChanges();
  });

  it('should initialize with user values', () => {
    expect(component.editUsername()).toBe(mockUser.username);
    expect(component.editFirstName()).toBe(mockUser.firstName || '');
    expect(component.editLastName()).toBe(mockUser.lastName || '');
  });

  it('should call updateUser and emit userUpdated on success', () => {
    userServiceSpy.updateUser.and.returnValue(of(mockUser));
    spyOn(component.userUpdated, 'emit');

    component.editUsername.set('newname');
    component.confirmEditUser();

    expect(userServiceSpy.updateUser).toHaveBeenCalledWith(mockUser.id, jasmine.objectContaining({ username: 'newname' }));
    expect(component.userUpdated.emit).toHaveBeenCalledWith(mockUser);
  });

  it('should call adminResetPassword if password is provided', () => {
    userServiceSpy.updateUser.and.returnValue(of(mockUser));
    userServiceSpy.adminResetPassword.and.returnValue(of(undefined));
    spyOn(component.userUpdated, 'emit');

    component.editPassword.set('newpassword');
    component.confirmEditUser();

    expect(userServiceSpy.updateUser).toHaveBeenCalled();
    expect(userServiceSpy.adminResetPassword).toHaveBeenCalledWith(mockUser.id, 'newpassword');
    expect(component.userUpdated.emit).toHaveBeenCalled();
  });

  it('should show error if updateUser fails', () => {
    userServiceSpy.updateUser.and.returnValue(throwError(() => ({ status: 409 })));

    component.confirmEditUser();

    expect(component.editError()).toBe('Username is already taken');
    expect(component.editLoading()).toBeFalse();
  });

  it('should emit cancelled when onCancel is called', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});
