export type SystemRole = "super_admin" | "admin" | "user";

export interface User {
    id: number;
    name: string;
    email: string;
    role: SystemRole;
    avatar: string | null;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}