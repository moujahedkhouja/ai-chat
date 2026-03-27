import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse, UserPage, CreateUserRequest } from '../models/user.model';

export interface UpdateUserRequest {
  linkedinUrl?: string | null;
  role?: string;
  email?: string;
  enabled?: boolean;
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`/api/users/${id}`);
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`/api/users/${id}`, request);
  }

  uploadAvatar(id: string, file: File): Observable<UserResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserResponse>(`/api/users/${id}/avatar`, formData);
  }

  listUsers(page: number = 0, size: number = 20): Observable<UserPage> {
    return this.http.get<UserPage>(`/api/users?page=${page}&size=${size}`);
  }

  createUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>('/api/users', request);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }

  adminResetPassword(id: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`/api/users/${id}/reset-password`, { newPassword });
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>('/api/profile', request);
  }

  getProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>('/api/profile');
  }
}
