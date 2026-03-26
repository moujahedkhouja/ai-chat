import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LoginRequest } from '../../models/auth.model';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form = inject(FormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  error = '';
  loading = false;
  showPassword = false;
  readonly isRtl = inject(DOCUMENT).documentElement.dir === 'rtl';
  readonly langService = inject(LanguageService);

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.value as LoginRequest).subscribe({
      next: (response) => {
        if (response.forcePasswordChange) {
          this.router.navigate(['/change-password']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.error = 'Invalid username or password';
        this.loading = false;
      }
    });
  }
}
