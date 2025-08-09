import { BaseApiService } from "./baseService";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
  lastLoginAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ProfileUpdateRequest {
  name?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

class AuthApiService extends BaseApiService {
  // Login with email/password
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Register new user
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get current user profile
  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>("/auth/me");
  }

  // Update user profile
  async updateProfile(
    data: ProfileUpdateRequest
  ): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Change password
  async changePassword(
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Logout
  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  }

  // Google OAuth login URL
  getGoogleLoginUrl(): string {
    return `http://localhost:4000/auth/google`;
  }

  // Token management
  setToken(token: string): void {
    localStorage.setItem("auth_token", token);
  }

  getToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  removeToken(): void {
    localStorage.removeItem("auth_token");
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthApiService();
