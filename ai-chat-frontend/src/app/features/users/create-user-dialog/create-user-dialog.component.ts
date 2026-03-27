import { Component, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { UserResponse } from '../../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.scss'
})
export class CreateUserDialogComponent {
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

  constructor(private userService: UserService) {}

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
        this.loading.set(false);
        this.userCreated.emit(user);
      },
      error: () => {
        this.error.set('Failed to create user');
        this.loading.set(false);
      }
    });
  }

  onCancel() {
    this.cancelled.emit();
  }
}
