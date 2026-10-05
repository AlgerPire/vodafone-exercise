export type CustomerRole = 'CUSTOMER' | 'ADMIN';

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  timestamp?: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterResponse {
  message: string;
  verificationUrl?: string | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  photoUrl: string;
}

export interface ProfileUpdateRequest {
  name: string;
  email: string;
  photoUrl: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  role: CustomerRole;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPage {
  content: Customer[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface AccessTokenClaims {
  customer_id?: string;
  name?: string;
  email?: string;
  roles?: string[];
  exp?: number;
}

export interface HealthResponse {
  status: string;
}
