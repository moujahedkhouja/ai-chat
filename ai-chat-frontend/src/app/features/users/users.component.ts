import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/user.service';
import { AuthService } from '../../auth/auth.service';
import { UserResponse } from '../../models/user.model';
import { CreateUserDialogComponent } from './create-user-dialog/create-user-dialog.component';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CreateUserDialogComponent, EditUserDialogComponent, ReactiveFormsModule, FormsModule, TranslateModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  readonly authService = inject(AuthService);
  private userService = inject(UserService);

  readonly users = signal<UserResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = signal(20);
  readonly showCreateForm = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly userToDelete = signal<UserResponse | null>(null);
  readonly userToEdit = signal<UserResponse | null>(null);

  readonly isAdmin = computed(() => this.authService.role() === 'ADMIN');

  ngOnInit() {
    this.loadUsers();
  }

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
    this.userToDelete.set(null);
    this.userService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.errorMessage.set('Failed to delete user')
    });
  }

  onUserCreated() {
    this.showCreateForm.set(false);
    this.loadUsers();
  }

  onUserUpdated() {
    this.userToEdit.set(null);
    this.loadUsers();
  }

  onEditUser(user: UserResponse, event?: Event) {
    event?.stopPropagation();
    this.userToEdit.set(user);
  }

  @HostListener('document:keydown.escape')
  onEscapePressed() {
    if (this.userToDelete()) {
      this.userToDelete.set(null);
    }
    if (this.userToEdit()) {
      this.userToEdit.set(null);
    }
  }
}
