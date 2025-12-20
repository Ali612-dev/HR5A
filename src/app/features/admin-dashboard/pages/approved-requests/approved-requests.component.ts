import { Component, OnInit, AfterViewInit, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { RequestService } from '../../../../core/request.service';
import { RequestStatus } from '../../../../core/interfaces/request.interface';
import { MaterialDataTableComponent, TableColumn, TableAction } from '../../../../shared/components/material-data-table';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-approved-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FontAwesomeModule,
    MaterialDataTableComponent
  ],
  templateUrl: './approved-requests.component.html',
  styleUrls: ['./approved-requests.component.css']
})
export class ApprovedRequestsComponent implements OnInit, AfterViewInit {
  private requestService = inject(RequestService);
  private translate = inject(TranslateService);

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faCircleCheck = faCircleCheck;

  // Data properties
  approvedRequests: any[] = [];
  isLoading = true;
  error: string | null = null;
  totalCount = 0;

  // Material Data Table
  tableColumns: TableColumn[] = [];
  tableActions: TableAction[] = [];
  
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('phoneTemplate') phoneTemplate!: TemplateRef<any>;
  @ViewChild('departmentTemplate') departmentTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;

  ngOnInit(): void {
    this.fetchApprovedRequests();
  }

  ngAfterViewInit(): void {
    this.initializeTableColumns();
    this.initializeTableActions();
  }

  private initializeTableColumns(): void {
    this.tableColumns = [
      {
        key: 'fullName',
        label: 'Name',
        sortable: true,
        align: 'center',
        cellTemplate: this.nameTemplate
      },
      {
        key: 'phoneNumber',
        label: 'Phone',
        sortable: true,
        align: 'center',
        cellTemplate: this.phoneTemplate
      },
      {
        key: 'department',
        label: 'Department',
        sortable: true,
        align: 'center',
        cellTemplate: this.departmentTemplate
      },
      {
        key: 'approvedDate',
        label: 'ApprovedDate',
        sortable: true,
        align: 'center',
        cellTemplate: this.dateTemplate
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        align: 'center',
        cellTemplate: this.statusTemplate
      }
    ];
  }

  private initializeTableActions(): void {
    // No actions for approved requests (read-only)
    this.tableActions = [];
  }

  fetchApprovedRequests(): void {
    this.isLoading = true;
    this.error = null;
    
    this.requestService.getRequests({ 
      status: RequestStatus.Approved, 
      pageNumber: 1, 
      pageSize: 50 
    }).pipe(
      catchError(err => {
        this.error = this.translate.instant('ERROR.FAILED_TO_LOAD_APPROVED_REQUESTS');
        console.error('Error fetching approved requests:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.approvedRequests = response.data.requests;
        this.totalCount = response.data.totalCount;
      } else if (!this.error) {
        this.error = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_APPROVED_REQUESTS');
      }
      this.isLoading = false;
    });
  }
}

