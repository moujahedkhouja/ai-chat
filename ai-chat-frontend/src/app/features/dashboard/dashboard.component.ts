import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse } from '../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  recentUsers = signal<UserResponse[]>([]);
  totalUsers = signal(0);

  readonly username = computed(() => this.authService.username() ?? 'User');
  readonly role = computed(() => this.authService.role() ?? '');
  readonly isAdminOrModerator = computed(() => {
    const r = this.authService.role();
    return r === 'ADMIN' || r === 'MODERATOR';
  });

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  ngOnInit() {
    if (this.isAdminOrModerator()) {
      this.userService.listUsers(0, 5).subscribe({
        next: (page) => {
          this.recentUsers.set(page.content);
          this.totalUsers.set(page.page.totalElements);
        }
      });
    }
  }

  getRoleBadgeClass(role: string): string {
    return role.toLowerCase();
  }

  getInitial(username: string): string {
    return username.charAt(0).toUpperCase();
  }
}
