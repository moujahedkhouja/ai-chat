import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { LanguageService } from '../../../core/language.service';
import { TranslatePipe } from '../../../core/translate.pipe';

@Component({
  selector: 'app-bottom-tab-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './bottom-tab-bar.component.html',
  styleUrl: './bottom-tab-bar.component.scss'
})
export class BottomTabBarComponent {
  constructor(
    private authService: AuthService,
    public langService: LanguageService
  ) {}

  get isAdminOrModerator(): boolean {
    const role = this.authService.getRole();
    return role === 'ADMIN' || role === 'MODERATOR';
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
