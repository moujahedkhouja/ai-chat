import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomTabBarComponent } from './bottom-tab-bar.component';
import { AuthService } from '../../../auth/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('BottomTabBarComponent', () => {
  let fixture: ComponentFixture<BottomTabBarComponent>;

  const mockAuthService = {
    getRole: () => 'ADMIN'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomTabBarComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(BottomTabBarComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show Users tab for ADMIN', () => {
    expect(fixture.componentInstance.isAdminOrModerator).toBeTrue();
  });

  it('should hide Users tab for USER role', () => {
    const comp = new BottomTabBarComponent({ getRole: () => 'USER' } as any);
    expect(comp.isAdminOrModerator).toBeFalse();
  });
});
