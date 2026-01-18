import { Injectable } from '@angular/core';
import { AttendanceViewModel } from './interfaces/attendance.interface';

@Injectable({
  providedIn: 'root'
})
export class AttendanceDataService {
  private attendanceData: any | null = null;

  setAttendanceData(data: any) {
    this.attendanceData = data;
  }

  getAttendanceData(): any | null {
    const data = this.attendanceData;
    this.attendanceData = null; // Clear the data after it has been retrieved
    return data;
  }
}
