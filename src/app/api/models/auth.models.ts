export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  captcha_token?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  roles?: string[];
  permissions?: string[];
  created_at?: string;
}

export interface TokenPayload {
  user_id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}

// Role-based access control interfaces
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// CAPTCHA interface
export interface CaptchaResponse {
  captcha_id: string;
  captcha_image: string; // Base64 encoded image
  expires_at: string;
}
