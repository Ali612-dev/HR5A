import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUserCircle, faPhone, faEnvelope, faBuilding, faIdCard, faCalendarAlt, faClock, faLocationDot } from '@fortawesome/free-solid-svg-icons';

import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { ViewAttendanceStore } from '../../../../store/view-attendance.store';
import { AttendanceViewModel } from '../../../../core/interfaces/attendance.interface';

import { ErrorComponent } from '../../../../shared/components/error/error.component';
import { AttendanceDataService } from '../../../../core/attendance-data.service';

@Component({
  selector: 'app-view-attendance',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent,
    RouterLink,
    ErrorComponent
  ],
  templateUrl: './view-attendance.component.html',
  styleUrls: ['./view-attendance.component.css']
})
export class ViewAttendanceComponent implements OnInit {
  readonly store = inject(ViewAttendanceStore);
  faArrowLeft = faArrowLeft;
  faUserCircle = faUserCircle;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faBuilding = faBuilding;
  faIdCard = faIdCard;
  faCalendarAlt = faCalendarAlt;
  faClock = faClock;
  faLocationDot = faLocationDot;

  private route = inject(ActivatedRoute);
  private attendanceDataService = inject(AttendanceDataService);

  ngOnInit(): void {
    // Check if data was passed via service first
    const passedData = this.attendanceDataService.getAttendanceData();
    if (passedData) {
      this.store.setAttendance(passedData);
      return;
    }

    // Otherwise load by ID
    const attendanceId = this.route.snapshot.paramMap.get('id');
    if (attendanceId && attendanceId !== '0') {
      this.store.loadAttendance(Number(attendanceId));
    }
  }

  onRetry(): void {
    const attendanceId = this.route.snapshot.paramMap.get('id');
    if (attendanceId) {
      this.store.loadAttendance(Number(attendanceId));
    }
  }
}
