export interface CreateUserRequest {
  username: string;
  userName?: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
}

export interface RegisterRequest extends CreateUserRequest {
  cardNumber?: string;
  department?: string;
}

export interface RegisterResponseData {
  userId: number;
  employeeId?: number | null;
  username: string;
  email: string;
  phoneNumber: string;
  token: string;
  fullName: string;
  isAdmin: boolean;
}

export interface UserDetailsDto {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdOn?: string;
  modifiedOn?: string;
  isSuccess?: boolean;
  token?: string | null;
}

export interface UpdateUserRequest {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password?: string;
}

export interface UpdateUserCredentialsRequest {
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password?: string;
}

export interface LoginRequest {
  userName: string;
  phoneNumber: string;
  password: string;
}

export interface LoginResponseData {
  employeeId: number;
  username: string;
  email: string;
  phoneNumber: string;
  token: string;
  fullName: string;
  isAdmin: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  message: string | null;
  isSuccess: boolean;
  errors: string[];
}