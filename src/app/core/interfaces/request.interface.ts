export interface RequestDto {
  id: number;
  fullName: string;
  phoneNumber: string;
  cardNumber: string;
  email: string;
  department: string;
  requestDate: string; // Assuming date comes as string, will need to parse if used as Date object
  status: RequestStatus; // Using the enum
  processedDate?: string; // Optional, for approved/rejected requests
}

export enum RequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface GetRequestsDto {
  status?: RequestStatus;
  pageNumber?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LatestRequestsResponseData {
  requests: RequestDto[];
  totalCount: number;
}
