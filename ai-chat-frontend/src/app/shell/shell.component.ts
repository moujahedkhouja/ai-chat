import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';
import { BottomTabBarComponent } from '../shared/components/bottom-tab-bar/bottom-tab-bar.component';
import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../core/theme.service';
import { LanguageService } from '../core/language.service';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, BottomTabBarComponent, TranslatePipe],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  constructor(
    private authService: AuthService,
    public theme: ThemeService,
    public lang: LanguageService,
  ) {}

  get username(): string {
    return this.authService.getUsername() ?? 'User';
  }
}
