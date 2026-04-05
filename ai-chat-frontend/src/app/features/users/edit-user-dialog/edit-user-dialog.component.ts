import { Component, output, input, signal, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { UserResponse } from '../../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../auth/auth.service';
import { ImageCropperDialogComponent } from '../../../shared/components/image-cropper-dialog/image-cropper-dialog.component';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, ImageCropperDialogComponent],
  templateUrl: './edit-user-dialog.component.html',
  styleUrl: './edit-user-dialog.component.scss'
})
export class EditUserDialogComponent {
  private authService: AuthService = inject(AuthService);
  private userService: UserService = inject(UserService);
  user = input<UserResponse | null>(null);
  userUpdated = output<UserResponse>();
  avatarUpdated = output<void>();
  cancelled = output<void>();

  editedUser = signal<UserResponse | null>(null);
  editUsername = signal('');
  editFirstName = signal('');
  editLastName = signal('');
  editPassword = signal('');
  editLoading = signal(false);
  editError = signal('');
  avatarUploading = signal(false);
  avatarError = signal('');
  showCropper = signal(false);
  imageChangedEvent = signal<Event | null>(null);

  avatarUrl = computed(() => {
    const user = this.editedUser();
    return this.authService.getAvatarUrl(user?.id, user?.hasAvatar);
  });

  constructor() {
    effect(() => {
      const user = this.user();
      if (!user) return;
      this.editedUser.set(user);
      this.editUsername.set(user.username);
      this.editFirstName.set(user.firstName || '');
      this.editLastName.set(user.lastName || '');
      this.editPassword.set('');
      this.editError.set('');
      this.avatarError.set('');
    });
  }

  confirmEditUser(): void {
    const user = this.user();
    if (!user) return;
    const username = this.editUsername();
    if (!username.trim()) return;
    this.editLoading.set(true);
    this.editError.set('');

    const updateRequest = {
      username: username.trim(),
      firstName: this.editFirstName().trim(),
      lastName: this.editLastName().trim()
    };

    this.userService.updateUser(user.id, updateRequest).subscribe({
      next: (updatedUser) => {
        const password = this.editPassword();
        if (password.trim()) {
          this.userService.adminResetPassword(user.id, password.trim()).subscribe({
            next: () => this.finalizeEdit(updatedUser),
            error: () => {
              this.editLoading.set(false);
              this.editError.set('User updated, but failed to reset password');
            }
          });
        } else {
          this.finalizeEdit(updatedUser);
        }
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err.status === 409
          ? 'Username is already taken'
          : 'Failed to update user');
      }
    });
  }

  private finalizeEdit(updatedUser: UserResponse): void {
    this.editLoading.set(false);
    this.editedUser.set(updatedUser);
    this.userUpdated.emit(updatedUser);
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const user = this.editedUser();
    if (!file || !user) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const isSquare = img.width === img.height;
      const isTooLarge = img.width > 1024 || img.height > 1024;
      const isTooSmall = img.width < 200 || img.height < 200;

      if (!isSquare || isTooLarge || isTooSmall) {
        this.imageChangedEvent.set(event);
        this.showCropper.set(true);
      } else {
        this.uploadAvatar(file);
        (event.target as HTMLInputElement).value = '';
      }
      URL.revokeObjectURL(img.src);
    };
  }

  onImageCropped(blob: Blob) {
    this.showCropper.set(false);
    const file = new File([blob], 'avatar.png', { type: 'image/png' });
    this.uploadAvatar(file);
    this.clearInput();
    this.imageChangedEvent.set(null);
  }

  onCropperCancelled() {
    this.showCropper.set(false);
    this.clearInput();
    this.imageChangedEvent.set(null);
  }

  private clearInput() {
    const event = this.imageChangedEvent();
    if (event?.target) {
      (event.target as HTMLInputElement).value = '';
    }
  }

  private uploadAvatar(file: File) {
    const user = this.editedUser();
    if (!user) return;
    this.avatarUploading.set(true);
    this.avatarError.set('');
    this.userService.uploadAvatar(user.id, file).subscribe({
      next: (updatedUser) => {
        this.editedUser.set(updatedUser);
        this.avatarUploading.set(false);
        this.avatarUpdated.emit();
      },
      error: () => {
        this.avatarError.set('Failed to upload avatar');
        this.avatarUploading.set(false);
      }
    });
  }

  onCancel() {
    this.cancelled.emit();
  }
}
