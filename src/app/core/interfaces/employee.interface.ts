export interface EmployeeDto {
  id: number;
  name: string;
  phone: string;
  department: string | null;
  email: string | null;
  cardNumber: string;
  isActive: boolean;
  joinedDate: string; // ISO date string
  selected?: boolean;
  showActions?: boolean;
}

export interface GetEmployeesRequest {
  pageNumber?: number;
  pageSize?: number;
  name?: string;
  phone?: string;
  department?: string;
  isActive?: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetEmployeesResponseData {
  employees: EmployeeDto[];
  totalCount: number;
}

export type CreateEmployeeDto = Omit<EmployeeDto, 'id'>;

export type UpdateEmployeeDto = Partial<Omit<EmployeeDto, 'id'>>;