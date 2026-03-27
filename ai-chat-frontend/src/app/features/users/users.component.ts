import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../auth/auth.service';
import { UserResponse } from '../../models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, CreateUserDialogComponent, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users = signal<UserResponse[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  currentPage = signal(0);
  pageSize = signal(20);
  isAdmin = computed(() => this.authService.role() === 'ADMIN');
  showCreateForm = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  constructor(
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  userToDelete = signal<UserResponse | null>(null);

  userToEdit = signal<UserResponse | null>(null);
  editUsername = signal('');
  editFirstName = signal('');
  editLastName = signal('');
  editPassword = signal('');
  editLoading = signal(false);
  editError = signal('');

  loadUsers() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.userService.listUsers(this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.totalElements.set(page.page.totalElements);
        this.totalPages.set(page.page.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load users');
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadUsers();
  }

  onDeleteUser(user: UserResponse) {
    this.userToDelete.set(user);
  }

  confirmDelete() {
    const user = this.userToDelete();
    if (!user) return;
    const id = user.id;
    this.userToDelete.set(null);
    this.userService.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.errorMessage.set('Failed to delete user')
    });
  }

  onUserCreated(user: UserResponse) {
    this.showCreateForm.set(false);
    this.loadUsers();
  }

  onEditUser(user: UserResponse, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.userToEdit.set(user);
    this.editUsername.set(user.username);
    this.editFirstName.set(user.firstName || '');
    this.editLastName.set(user.lastName || '');
    this.editPassword.set('');
    this.editError.set('');
  }

  confirmEditUser(): void {
    const user = this.userToEdit();
    const username = this.editUsername();
    if (!user || !username.trim()) return;
    this.editLoading.set(true);
    this.editError.set('');

    const updateRequest = {
      username: username.trim(),
      firstName: this.editFirstName().trim(),
      lastName: this.editLastName().trim()
    };

    this.userService.updateUser(user.id, updateRequest).subscribe({
      next: () => {
        const password = this.editPassword();
        if (password.trim() && user) {
          this.userService.adminResetPassword(user.id, password.trim()).subscribe({
            next: () => this.finalizeEdit(),
            error: () => {
              this.editLoading.set(false);
              this.editError.set('User updated, but failed to reset password');
            }
          });
        } else {
          this.finalizeEdit();
        }
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err.status === 409
          ? 'Username is already taken'
          : 'Failed to update user');
      }
    });
  }

  private finalizeEdit(): void {
    this.editLoading.set(false);
    this.userToEdit.set(null);
    this.loadUsers();
  }
}
