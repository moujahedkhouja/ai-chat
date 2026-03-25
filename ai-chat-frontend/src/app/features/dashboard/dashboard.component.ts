import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../core/user.service';
import { UserResponse } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  recentUsers: UserResponse[] = [];
  totalUsers = 0;

  constructor(
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    if (this.isAdminOrModerator) {
      this.userService.listUsers(0, 5).subscribe({
        next: (page) => {
          this.recentUsers = page.content;
          this.totalUsers = page.page.totalElements;
        }
      });
    }
  }

  get username(): string {
    return this.authService.getUsername() ?? 'User';
  }

  get role(): string {
    return this.authService.getRole() ?? '';
  }

  get isAdminOrModerator(): boolean {
    const r = this.authService.getRole();
    return r === 'ADMIN' || r === 'MODERATOR';
  }

  getRoleBadgeClass(role: string): string {
    return role.toLowerCase();
  }

  getInitial(username: string): string {
    return username.charAt(0).toUpperCase();
  }
}
