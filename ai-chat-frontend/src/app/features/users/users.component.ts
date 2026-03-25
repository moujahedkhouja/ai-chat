import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../auth/auth.service';
import { UserResponse } from '../../models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CreateUserDialogComponent, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: UserResponse[] = [];
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 20;
  isAdmin = false;
  showCreateForm = false;
  loading = false;
  errorMessage = '';

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.errorMessage = '';
    this.userService.listUsers(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.users = page.content;
        this.totalElements = page.page.totalElements;
        this.totalPages = page.page.totalPages;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  onDeleteUser(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.userService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.errorMessage = 'Failed to delete user'
    });
  }

  onUserCreated(user: UserResponse) {
    this.showCreateForm = false;
    this.loadUsers();
  }
}
