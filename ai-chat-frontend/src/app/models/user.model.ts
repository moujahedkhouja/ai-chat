export interface CreateUserRequest {
  username: string;
  email: string;
  temporaryPassword: string;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
  enabled: boolean;
  forcePasswordChange: boolean;
  profilePicturePath: string | null;
  linkedinUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPage {
  content: UserResponse[];
  page: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}
