import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse } from '../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';
import { ImageCropperDialogComponent } from '../../shared/components/image-cropper-dialog/image-cropper-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, ImageCropperDialogComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user = signal<UserResponse | null>(null);

  private fb = inject(FormBuilder);

  infoForm = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: ['']
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  infoLoading = signal(false);
  infoSuccess = signal('');
  infoError = signal('');

  passwordLoading = signal(false);
  passwordSuccess = signal('');
  passwordError = signal('');

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);

  avatarUploading = signal(false);
  avatarError = signal('');
  showCropper = signal(false);
  imageChangedEvent = signal<Event | null>(null);

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.infoForm.patchValue({
          username: user.username,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        });
      },
      error: () => this.infoError.set('Failed to load profile')
    });
  }

  onSaveInfo() {
    if (this.infoForm.invalid) return;
    this.infoLoading.set(true);
    this.infoSuccess.set('');
    this.infoError.set('');
    const { username, email, firstName, lastName } = this.infoForm.getRawValue();
    this.userService.updateProfile({
      username: username!,
      email: email!,
      firstName: firstName || '',
      lastName: lastName || ''
    }).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.infoSuccess.set('Profile updated');
        this.infoLoading.set(false);
        this.authService.refreshFromProfile(updated);
      },
      error: (err) => {
        this.infoError.set(err?.error?.error ?? 'Failed to update profile');
        this.infoLoading.set(false);
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.passwordLoading.set(true);
    this.passwordSuccess.set('');
    this.passwordError.set('');
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.authService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.passwordSuccess.set('Password changed successfully');
        this.passwordForm.reset();
        this.passwordLoading.set(false);
      },
      error: (err) => {
        this.passwordError.set(err?.error?.error ?? 'Failed to change password');
        this.passwordLoading.set(false);
      }
    });
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const user = this.user();
    if (!file || !user) return;

    // Check if the image is square and has reasonable dimensions
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
    const user = this.user();
    if (!user) return;
    this.avatarUploading.set(true);
    this.avatarError.set('');
    this.userService.uploadAvatar(user.id, file).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.avatarUploading.set(false);
        this.authService.refreshFromProfile(updated);
      },
      error: () => {
        this.avatarError.set('Failed to upload avatar');
        this.avatarUploading.set(false);
      }
    });
  }

  avatarUrl = computed(() => {
    const user = this.authService.currentUser();
    return this.authService.getAvatarUrl(user?.userId, user?.profilePicturePath);
  });
}
