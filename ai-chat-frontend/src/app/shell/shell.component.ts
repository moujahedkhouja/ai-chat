import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { BottomTabBarComponent } from '../shared/components/bottom-tab-bar/bottom-tab-bar.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, BottomTabBarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  constructor(private authService: AuthService) {}

  get username(): string {
    return this.authService.getUsername() ?? 'User';
  }
}
