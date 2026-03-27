import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { ThemeService } from '../../../core/theme.service';
import { LanguageService } from '../../../core/language.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    public langService: LanguageService
  ) {}

  get username(): string {
    return this.authService.getUsername() ?? 'Unknown';
  }

  get displayName(): string {
    const user = this.authService.currentUserSignal();
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.username ?? 'Unknown';
  }

  get role(): string {
    return this.authService.currentUserSignal()?.role ?? '';
  }

  get avatarUrl(): string | null {
    const user = this.authService.currentUserSignal();
    return this.authService.getAvatarUrl(user?.userId, user?.profilePicturePath);
  }

  get isAdminOrModerator(): boolean {
    const role = this.authService.getRole();
    return role === 'ADMIN' || role === 'MODERATOR';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']) // navigate regardless
    });
  }
}
