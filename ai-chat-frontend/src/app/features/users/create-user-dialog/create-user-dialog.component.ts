import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { UserResponse } from '../../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './create-user-dialog.component.html',
  styleUrl: './create-user-dialog.component.scss'
})
export class CreateUserDialogComponent {
  @Output() userCreated = new EventEmitter<UserResponse>();
  @Output() cancelled = new EventEmitter<void>();

  form = inject(FormBuilder).group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    temporaryPassword: ['', [Validators.required, Validators.minLength(8)]],
    role: ['USER', Validators.required]
  });

  loading = false;
  error = '';

  constructor(private userService: UserService) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { username, firstName, lastName, email, temporaryPassword, role } = this.form.value;
    this.userService.createUser({
      username: username!,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email!,
      temporaryPassword: temporaryPassword!,
      role: role as 'ADMIN' | 'MODERATOR' | 'USER'
    }).subscribe({
      next: (user) => {
        this.loading = false;
        this.userCreated.emit(user);
      },
      error: () => {
        this.error = 'Failed to create user';
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.cancelled.emit();
  }
}
