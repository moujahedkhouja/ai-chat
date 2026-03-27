import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse } from '../../models/user.model';
import { TranslatePipe } from '../../core/translate.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: UserResponse | null = null;

  private fb = inject(FormBuilder);

  infoForm = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]]
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  infoLoading = false;
  infoSuccess = '';
  infoError = '';

  passwordLoading = false;
  passwordSuccess = '';
  passwordError = '';

  showCurrentPassword = false;
  showNewPassword = false;

  avatarUploading = false;
  avatarError = '';

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.infoForm.patchValue({ username: user.username, email: user.email });
      },
      error: () => this.infoError = 'Failed to load profile'
    });
  }

  onSaveInfo() {
    if (this.infoForm.invalid) return;
    this.infoLoading = true;
    this.infoSuccess = '';
    this.infoError = '';
    const { username, email } = this.infoForm.value;
    this.userService.updateProfile({ username: username!, email: email! }).subscribe({
      next: (updated) => {
        this.user = updated;
        this.infoSuccess = 'Profile updated';
        this.infoLoading = false;
        this.authService.refreshFromProfile(updated);
      },
      error: (err) => {
        this.infoError = err?.error?.error ?? 'Failed to update profile';
        this.infoLoading = false;
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    this.passwordLoading = true;
    this.passwordSuccess = '';
    this.passwordError = '';
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully';
        this.passwordForm.reset();
        this.passwordLoading = false;
      },
      error: (err) => {
        this.passwordError = err?.error?.error ?? 'Failed to change password';
        this.passwordLoading = false;
      }
    });
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.user) return;
    this.avatarUploading = true;
    this.avatarError = '';
    this.userService.uploadAvatar(this.user.id, file).subscribe({
      next: (updated) => {
        this.user = updated;
        this.avatarUploading = false;
      },
      error: () => {
        this.avatarError = 'Failed to upload avatar';
        this.avatarUploading = false;
      }
    });
  }

  getAvatarUrl(): string | null {
    if (!this.user?.profilePicturePath) return null;
    return `/uploads/${this.user.profilePicturePath}`;
  }
}
