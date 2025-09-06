import { Injectable } from '@angular/core';
import { AttendanceViewModel } from './interfaces/attendance.interface';

@Injectable({
  providedIn: 'root'
})
export class AttendanceDataService {
  private attendanceData: AttendanceViewModel | null = null;

  setAttendanceData(data: AttendanceViewModel) {
    this.attendanceData = data;
  }

  getAttendanceData(): AttendanceViewModel | null {
    const data = this.attendanceData;
    this.attendanceData = null; // Clear the data after it has been retrieved
    return data;
  }
}
