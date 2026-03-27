import { Component, output, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { UserResponse } from '../../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './edit-user-dialog.component.html',
  styleUrl: './edit-user-dialog.component.scss'
})
export class EditUserDialogComponent {
  user = input<UserResponse | null>(null);
  userUpdated = output<UserResponse>();
  cancelled = output<void>();

  editUsername = signal('');
  editFirstName = signal('');
  editLastName = signal('');
  editPassword = signal('');
  editLoading = signal(false);
  editError = signal('');

  constructor(private userService: UserService) {
    effect(() => {
      const user = this.user();
      if (!user) return;
      this.editUsername.set(user.username);
      this.editFirstName.set(user.firstName || '');
      this.editLastName.set(user.lastName || '');
      this.editPassword.set('');
      this.editError.set('');
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
    this.userUpdated.emit(updatedUser);
  }

  onCancel() {
    this.cancelled.emit();
  }
}
