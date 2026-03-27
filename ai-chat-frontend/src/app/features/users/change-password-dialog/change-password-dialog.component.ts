import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { UserResponse } from '../../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss'
})
export class ChangePasswordDialogComponent {
  @Input() user!: UserResponse;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = new FormBuilder().group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatch }
  );

  showPassword = false;
  loading = false;
  error = '';

  constructor(private userService: UserService) {}

  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && !!this.form.get('confirmPassword')?.dirty;
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const newPassword = this.form.value.newPassword!;
    this.userService.adminResetPassword(this.user.id, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.form.reset();
        this.showPassword = false;
        this.saved.emit();
      },
      error: () => {
        this.error = 'Failed to change password';
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.cancelled.emit();
  }
}
