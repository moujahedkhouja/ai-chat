import { Component, OnInit, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: UserResponse | null = null;
  form = inject(FormBuilder).group({
    linkedinUrl: ['']
  });
  loading = false;
  avatarUploading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.userService.getUser(userId).subscribe({
        next: (user) => {
          this.user = user;
          this.form.patchValue({ linkedinUrl: user.linkedinUrl || '' });
        },
        error: () => this.errorMessage = 'Failed to load profile'
      });
    }
  }

  onSave() {
    if (!this.user) return;
    this.loading = true;
    this.userService.updateUser(this.user.id, { linkedinUrl: this.form.value.linkedinUrl })
      .subscribe({
        next: (updated) => {
          this.user = updated;
          this.successMessage = 'Profile updated successfully';
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to update profile';
          this.loading = false;
        }
      });
  }

  onAvatarChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.user) return;
    this.avatarUploading = true;
    this.userService.uploadAvatar(this.user.id, file).subscribe({
      next: (updated) => {
        this.user = updated;
        this.avatarUploading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to upload avatar';
        this.avatarUploading = false;
      }
    });
  }

  getAvatarUrl(): string | null {
    if (!this.user?.profilePicturePath) return null;
    return `/uploads/${this.user.profilePicturePath}`;
  }
}
