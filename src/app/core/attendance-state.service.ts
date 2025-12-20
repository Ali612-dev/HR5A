import { Injectable } from '@angular/core';

export interface AttendanceFilterState {
  date: string | null;
  employeeName: string;
  isFilterCollapsed: boolean;
  pageNumber: number;
  sortField: string | null;
  sortOrder: 'asc' | 'desc' | null;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceStateService {
  private state: AttendanceFilterState | null = null;

  /**
   * Save attendance filter state (only in memory, not persisted)
   */
  saveState(state: AttendanceFilterState): void {
    this.state = { ...state };
    console.log('💾 Attendance state saved to memory:', this.state);
  }

  /**
   * Get saved attendance filter state
   */
  getState(): AttendanceFilterState | null {
    return this.state ? { ...this.state } : null;
  }

  /**
   * Clear saved state
   */
  clearState(): void {
    this.state = null;
    console.log('🗑️ Attendance state cleared from memory');
  }

  /**
   * Check if state exists
   */
  hasState(): boolean {
    return this.state !== null;
  }
}

