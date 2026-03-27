export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CurrentUser {
  userId: string;
  username: string;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
  forcePasswordChange: boolean;
  profilePicturePath: string | null;
}

// AuthResponse from backend (no token)
export interface AuthResponse extends CurrentUser {}
