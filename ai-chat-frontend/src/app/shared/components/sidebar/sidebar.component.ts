import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  get username(): string {
    return this.authService.getUsername() ?? 'Unknown';
  }

  get role(): string {
    return this.authService.getRole() ?? '';
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
