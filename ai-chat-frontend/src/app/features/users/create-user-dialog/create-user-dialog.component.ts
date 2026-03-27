import { Component, output, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { UserResponse } from '../../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';
import { ImageCropperDialogComponent } from '../../../shared/components/image-cropper-dialog/image-cropper-dialog.component';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ImageCropperDialogComponent],
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.scss'
})
export class CreateUserDialogComponent implements OnDestroy {
  userCreated = output<UserResponse>();
  cancelled = output<void>();

  form = inject(FormBuilder).group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
    role: ['USER', Validators.required]
  });

  loading = signal(false);
  error = signal('');
  showCropper = signal(false);
  imageChangedEvent = signal<Event | null>(null);
  selectedAvatarFile = signal<File | null>(null);
  avatarPreviewUrl = signal<string | null>(null);

  avatarInitial() {
    const username = this.form.controls.username.value || '';
    return username.charAt(0).toUpperCase() || '?';
  }

  constructor(private userService: UserService) {}

  ngOnDestroy() {
    this.revokeAvatarPreview();
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { username, firstName, lastName, email, temporaryPassword, role } = this.form.getRawValue();
    this.userService.createUser({
      username: username!,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email!,
      temporaryPassword: temporaryPassword!,
      role: role as 'ADMIN' | 'MODERATOR' | 'USER'
    }).subscribe({
      next: (user) => {
        const avatarFile = this.selectedAvatarFile();
        if (!avatarFile) {
          this.loading.set(false);
          this.userCreated.emit(user);
          return;
        }
        this.userService.uploadAvatar(user.id, avatarFile).subscribe({
          next: (updatedUser) => {
            this.loading.set(false);
            this.userCreated.emit(updatedUser);
          },
          error: () => {
            this.loading.set(false);
            this.userCreated.emit(user);
          }
        });
      },
      error: () => {
        this.error.set('Failed to create user');
        this.loading.set(false);
      }
    });
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

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
        this.setAvatarFile(file);
        (event.target as HTMLInputElement).value = '';
      }
      URL.revokeObjectURL(img.src);
    };
  }

  onImageCropped(blob: Blob) {
    this.showCropper.set(false);
    const file = new File([blob], 'avatar.png', { type: 'image/png' });
    this.setAvatarFile(file);
    this.clearInput();
    this.imageChangedEvent.set(null);
  }

  onCropperCancelled() {
    this.showCropper.set(false);
    this.clearInput();
    this.imageChangedEvent.set(null);
  }

  private setAvatarFile(file: File) {
    this.selectedAvatarFile.set(file);
    this.revokeAvatarPreview();
    this.avatarPreviewUrl.set(URL.createObjectURL(file));
  }

  private revokeAvatarPreview() {
    const currentPreview = this.avatarPreviewUrl();
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
    }
  }

  private clearInput() {
    const event = this.imageChangedEvent();
    if (event?.target) {
      (event.target as HTMLInputElement).value = '';
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}
