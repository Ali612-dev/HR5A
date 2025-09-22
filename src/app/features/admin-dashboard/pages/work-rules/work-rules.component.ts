import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faGear, faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-work-rules',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent
  ],
  templateUrl: './work-rules.component.html',
  styleUrls: ['./work-rules.component.css']
})
export class WorkRulesComponent implements OnInit {
  private translate = inject(TranslateService);

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faGear = faGear;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;

  // Data properties
  workRules: any[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.fetchWorkRules();
  }

  fetchWorkRules(): void {
    this.isLoading = true;
    this.error = null;
    
    // Mock data for now - replace with actual service call
    setTimeout(() => {
      this.workRules = [
        {
          id: 1,
          title: 'Working Hours',
          description: 'Standard working hours are from 9:00 AM to 5:00 PM',
          category: 'General',
          isActive: true,
          createdAt: new Date('2024-01-15')
        },
        {
          id: 2,
          title: 'Break Time',
          description: 'Employees are entitled to 1 hour lunch break',
          category: 'General',
          isActive: true,
          createdAt: new Date('2024-01-15')
        },
        {
          id: 3,
          title: 'Overtime Policy',
          description: 'Overtime must be approved by supervisor',
          category: 'Overtime',
          isActive: true,
          createdAt: new Date('2024-01-16')
        }
      ];
      this.isLoading = false;
    }, 1000);
  }

  addWorkRule(): void {
    // TODO: Implement add work rule functionality
    console.log('Add work rule clicked');
  }

  editWorkRule(rule: any): void {
    // TODO: Implement edit work rule functionality
    console.log('Edit work rule clicked', rule);
  }

  deleteWorkRule(rule: any): void {
    // TODO: Implement delete work rule functionality
    console.log('Delete work rule clicked', rule);
  }

  toggleRuleStatus(rule: any): void {
    rule.isActive = !rule.isActive;
    // TODO: Implement API call to update rule status
    console.log('Toggle rule status', rule);
  }
}

