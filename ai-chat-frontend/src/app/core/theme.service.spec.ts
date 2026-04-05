import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('defaults to light when nothing is stored', () => {
    expect(service.isDark()).toBeFalse();
  });

  it('loads light theme from localStorage', () => {
    localStorage.setItem('app_theme', 'light');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fresh = TestBed.inject(ThemeService);
    expect(fresh.isDark()).toBeFalse();
  });

  it('toggle() switches light → dark and persists', () => {
    service.toggle();
    expect(service.isDark()).toBeTrue();
    expect(localStorage.getItem('app_theme')).toBe('dark');
  });

  it('toggle() switches dark → light and persists', () => {
    service.toggle(); // light → dark
    service.toggle(); // dark → light
    expect(service.isDark()).toBeFalse();
    expect(localStorage.getItem('app_theme')).toBe('light');
  });

  it('apply() sets theme-light class on <html>', () => {
    service.apply();
    expect(document.documentElement.classList.contains('theme-light')).toBeTrue();
  });

  it('apply() sets theme-light class on <html> after toggle', () => {
    service.toggle();
    service.apply();
    expect(document.documentElement.classList.contains('theme-light')).toBeTrue();
    expect(document.documentElement.classList.contains('theme-dark')).toBeFalse();
  });
});
