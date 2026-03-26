import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LoginRequest } from '../../models/auth.model';
import { ThemeService } from '../../core/theme.service';
import { LanguageService } from '../../core/language.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
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

  constructor(
    private authService: AuthService,
    private router: Router,
    public theme: ThemeService,
    public lang: LanguageService,
  ) {}

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
        this.error = this.lang.t('login.error');
        this.loading = false;
      }
    });
  }
}
