import { Component, computed } from '@angular/core';
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
  readonly username = computed(() => this.authService.username() ?? 'Unknown');

  readonly displayName = computed(() => {
    const user = this.authService.currentUser();
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.username ?? 'Unknown';
  });

  readonly role = computed(() => this.authService.currentUser()?.role ?? '');

  readonly avatarUrl = computed(() => {
    const user = this.authService.currentUser();
    return this.authService.getAvatarUrl(user?.userId, user?.hasAvatar);
  });

  readonly isAdminOrModerator = computed(() => {
    const r = this.authService.role();
    return r === 'ADMIN' || r === 'MODERATOR';
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    public langService: LanguageService
  ) {}

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']) // navigate regardless
    });
  }
}
