
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUserCircle, faPhone, faEnvelope, faBuilding, faIdCard, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { ViewEmployeeStore } from '../../../../store/view-employee.store';
import { EmployeeDto } from '../../../../core/interfaces/employee.interface';

@Component({
  selector: 'app-view-employee',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent,
    RouterLink
  ],
  templateUrl: './view-employee.html',
  styleUrls: ['./view-employee.css']
})
export class ViewEmployeeComponent implements OnInit {
  readonly store = inject(ViewEmployeeStore);
  faArrowLeft = faArrowLeft;
  faUserCircle = faUserCircle;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faBuilding = faBuilding;
  faIdCard = faIdCard;
  faCalendarAlt = faCalendarAlt;

  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      this.store.loadEmployee(Number(employeeId));
    }
  }
}
