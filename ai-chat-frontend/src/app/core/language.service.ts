import { Injectable, RendererFactory2, Renderer2 } from '@angular/core';

export type Lang = 'en' | 'ar';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.users': 'Users',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Top bar
    'topbar.greeting': 'Welcome back',
    'topbar.notifications': 'Notifications',

    // Login
    'login.brand.tagline': 'Your intelligent workspace, always ready.',
    'login.feature.secure': 'Secure',
    'login.feature.private': 'Private',
    'login.feature.ai': 'AI-Powered',
    'login.title': 'Welcome back',
    'login.subtitle': 'Sign in to your account',
    'login.username': 'Username',
    'login.username.placeholder': 'Enter your username',
    'login.password': 'Password',
    'login.password.placeholder': 'Enter your password',
    'login.submit': 'Sign in',
    'login.submitting': 'Signing in...',
    'login.error': 'Invalid username or password',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Welcome back',
    'dashboard.total-users': 'Total Users',
    'dashboard.your-role': 'Your Role',
    'dashboard.recent-users': 'Recent Users',
    'dashboard.view-all': 'View all',
    'dashboard.welcome.title': 'Welcome to AI Chat',
    'dashboard.welcome.text': 'Your workspace is ready. Use the navigation to get started.',

    // Table
    'table.user': 'User',
    'table.email': 'Email',
    'table.role': 'Role',

    // Profile
    'profile.title': 'Profile',
    'profile.subtitle': 'Manage your account',
    'profile.linkedin': 'LinkedIn URL',
    'profile.save': 'Save changes',
    'profile.saving': 'Saving...',
    'profile.upload-avatar': 'Change photo',
    'profile.success': 'Profile updated successfully',
    'profile.error': 'Failed to update profile',

    // Change password
    'password.title': 'Change Password',
    'password.subtitle': 'Keep your account secure',
    'password.current': 'Current Password',
    'password.new': 'New Password',
    'password.confirm': 'Confirm New Password',
    'password.submit': 'Update Password',
    'password.submitting': 'Updating...',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.profile': 'الملف الشخصي',
    'nav.users': 'المستخدمون',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',

    // Top bar
    'topbar.greeting': 'مرحباً بعودتك',
    'topbar.notifications': 'الإشعارات',

    // Login
    'login.brand.tagline': 'مساحة عملك الذكية، دائماً جاهزة.',
    'login.feature.secure': 'آمن',
    'login.feature.private': 'خاص',
    'login.feature.ai': 'مدعوم بالذكاء الاصطناعي',
    'login.title': 'مرحباً بعودتك',
    'login.subtitle': 'تسجيل الدخول إلى حسابك',
    'login.username': 'اسم المستخدم',
    'login.username.placeholder': 'أدخل اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.password.placeholder': 'أدخل كلمة المرور',
    'login.submit': 'تسجيل الدخول',
    'login.submitting': 'جاري تسجيل الدخول...',
    'login.error': 'اسم المستخدم أو كلمة المرور غير صحيحة',

    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.subtitle': 'مرحباً بعودتك',
    'dashboard.total-users': 'إجمالي المستخدمين',
    'dashboard.your-role': 'دورك',
    'dashboard.recent-users': 'المستخدمون الأخيرون',
    'dashboard.view-all': 'عرض الكل',
    'dashboard.welcome.title': 'مرحباً في AI Chat',
    'dashboard.welcome.text': 'مساحة عملك جاهزة. استخدم التنقل للبدء.',

    // Table
    'table.user': 'مستخدم',
    'table.email': 'البريد الإلكتروني',
    'table.role': 'الدور',

    // Profile
    'profile.title': 'الملف الشخصي',
    'profile.subtitle': 'إدارة حسابك',
    'profile.linkedin': 'رابط LinkedIn',
    'profile.save': 'حفظ التغييرات',
    'profile.saving': 'جاري الحفظ...',
    'profile.upload-avatar': 'تغيير الصورة',
    'profile.success': 'تم تحديث الملف الشخصي بنجاح',
    'profile.error': 'فشل تحديث الملف الشخصي',

    // Change password
    'password.title': 'تغيير كلمة المرور',
    'password.subtitle': 'حافظ على أمان حسابك',
    'password.current': 'كلمة المرور الحالية',
    'password.new': 'كلمة المرور الجديدة',
    'password.confirm': 'تأكيد كلمة المرور الجديدة',
    'password.submit': 'تحديث كلمة المرور',
    'password.submitting': 'جاري التحديث...',
  },
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private renderer: Renderer2;
  current: Lang = 'en';

  constructor(factory: RendererFactory2) {
    this.renderer = factory.createRenderer(null, null);
    const saved = localStorage.getItem('lang') as Lang;
    this.apply(saved === 'ar' ? 'ar' : 'en');
  }

  get isRtl(): boolean {
    return this.current === 'ar';
  }

  toggle(): void {
    this.apply(this.current === 'en' ? 'ar' : 'en');
  }

  t(key: string): string {
    return TRANSLATIONS[this.current][key] ?? key;
  }

  private apply(lang: Lang): void {
    this.current = lang;
    this.renderer.setAttribute(document.documentElement, 'lang', lang);
    this.renderer.setAttribute(document.documentElement, 'dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('lang', lang);
  }
}
