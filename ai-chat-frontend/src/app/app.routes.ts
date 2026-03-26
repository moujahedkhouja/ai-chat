import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ShellComponent } from './shell/shell.component';
import { ChangePasswordComponent } from './features/change-password/change-password.component';
import { authGuard } from './auth/guards/auth.guard';
import { forcePasswordChangeGuard } from './auth/guards/force-password-change.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [forcePasswordChangeGuard] },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), canActivate: [forcePasswordChangeGuard] },
      { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent), canActivate: [forcePasswordChangeGuard] },
      { path: 'chat', loadComponent: () =>
          import('./features/chat/chat.component').then(m => m.ChatComponent),
        canActivate: [forcePasswordChangeGuard] },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
