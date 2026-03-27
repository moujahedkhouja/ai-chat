import { Component, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LoginRequest } from '../../models/auth.model';
import { LanguageService } from '../../core/language.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form = inject(FormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  error = signal('');
  loading = signal(false);
  showPassword = signal(false);
  readonly isRtl = inject(DOCUMENT).documentElement.dir === 'rtl';
  readonly langService = inject(LanguageService);

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.form.getRawValue() as LoginRequest).subscribe({
      next: (response) => {
        if (response.forcePasswordChange) {
          this.router.navigate(['/change-password']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.error.set('Invalid username or password');
        this.loading.set(false);
      }
    });
  }
}
