import { Component, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
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
  readonly username = computed(() => this.authService.username() ?? 'User');

  constructor(private authService: AuthService, private router: Router) {}

  get isChatPage(): boolean {
    return this.router.url.startsWith('/chat');
  }
}
