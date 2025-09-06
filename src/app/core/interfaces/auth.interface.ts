export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  cardNumber: string;
  email: string;
  department: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponseData {
  username: string;
  email: string;
  phoneNumber: string;
  token: string;
  fullName: string;
}

export interface ApiResponse<T> {
  data: T | null;
  message: string | null;
  isSuccess: boolean;
  errors: string[];
}