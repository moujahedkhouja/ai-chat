import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../auth/auth.service';
import { UserResponse } from '../../models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CreateUserDialogComponent, ChangePasswordDialogComponent, ReactiveFormsModule, FormsModule],
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

  userToDelete: UserResponse | null = null;
  userToChangePassword: UserResponse | null = null;

  userToEditUsername: UserResponse | null = null;
  editUsernameValue = '';
  editUsernameLoading = false;
  editUsernameError = '';

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

  onDeleteUser(user: UserResponse) {
    this.userToDelete = user;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    const id = this.userToDelete.id;
    this.userToDelete = null;
    this.userService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.errorMessage = 'Failed to delete user'
    });
  }

  onUserCreated(user: UserResponse) {
    this.showCreateForm = false;
    this.loadUsers();
  }

  onPasswordChanged() {
    this.userToChangePassword = null;
  }

  onEditUsername(user: UserResponse): void {
    this.userToEditUsername = user;
    this.editUsernameValue = user.username;
    this.editUsernameError = '';
  }

  confirmEditUsername(): void {
    if (!this.userToEditUsername || !this.editUsernameValue.trim()) return;
    this.editUsernameLoading = true;
    this.editUsernameError = '';
    this.userService.updateUser(this.userToEditUsername.id, { username: this.editUsernameValue.trim() }).subscribe({
      next: () => {
        this.editUsernameLoading = false;
        this.userToEditUsername = null;
        this.loadUsers();
      },
      error: (err) => {
        this.editUsernameLoading = false;
        this.editUsernameError = err.status === 409
          ? 'Username is already taken'
          : 'Failed to update username';
      }
    });
  }
}
