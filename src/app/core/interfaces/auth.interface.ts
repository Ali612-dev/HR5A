export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  cardNumber: string;
  email: string;
  department: string;
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