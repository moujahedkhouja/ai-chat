import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../auth/auth.service';
import { UserResponse } from '../../models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, CreateUserDialogComponent, ChangePasswordDialogComponent, ReactiveFormsModule, FormsModule, TranslateModule],
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
    public authService: AuthService,
    private userService: UserService
  ) {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
  }

  ngOnInit() {
    this.loadUsers();
  }

  userToDelete: UserResponse | null = null;
  userToChangePassword: UserResponse | null = null;

  userToEdit: UserResponse | null = null;
  editValue = { username: '', firstName: '', lastName: '' };
  editLoading = false;
  editError = '';

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

  onEditUser(user: UserResponse, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.userToEdit = user;
    this.editValue = {
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    };
    this.editError = '';
  }

  confirmEditUser(): void {
    if (!this.userToEdit || !this.editValue.username.trim()) return;
    this.editLoading = true;
    this.editError = '';
    this.userService.updateUser(this.userToEdit.id, {
      username: this.editValue.username.trim(),
      firstName: this.editValue.firstName.trim(),
      lastName: this.editValue.lastName.trim()
    }).subscribe({
      next: () => {
        this.editLoading = false;
        this.userToEdit = null;
        this.loadUsers();
      },
      error: (err) => {
        this.editLoading = false;
        this.editError = err.status === 409
          ? 'Username is already taken'
          : 'Failed to update user';
      }
    });
  }
}
