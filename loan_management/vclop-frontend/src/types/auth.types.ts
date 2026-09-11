export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarPath: string | null;
  branchId: string | null;
  departmentId: string | null;
  jobTitle: string | null;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginCredentials {
  login: string;
  password: string;
}
