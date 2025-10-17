
import { MatDialog } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { RejectionReasonDialogComponent } from '../../../../shared/components/rejection-reason-dialog/rejection-reason-dialog.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/auth.service';
import { AuthStore } from '../../../../store/auth.store';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPeopleGroup,
  faMapLocationDot,
  faHourglassHalf,
  faCircleCheck,
  faArrowRight,
  faArrowRightFromBracket,
  faCheck,
  faXmark,
  faInbox,
  faUsers,
  faDollarSign
} from '@fortawesome/free-solid-svg-icons';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { trigger, state, style, animate, transition, query, stagger } from '@angular/animations';
import { TypingTextComponent } from '../../../../shared/components/typing-text/typing-text.component';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { CustomTooltipDirective } from '../../../../shared/directives/custom-tooltip.directive';
import { DashboardService } from '../../../../core/dashboard.service';
import { DashboardStatsResponseData } from '../../../../core/interfaces/dashboard.interface';
import { RequestService } from '../../../../core/request.service';
import { RequestDto, RequestStatus, LatestRequestsResponseData } from '../../../../core/interfaces/request.interface';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface PendingRequest {
  id: number;
  fullName: string;
  phoneNumber: string;
  department: string;
  requestDate: string; // Changed to string to match DTO
}

interface RecentApproval {
  id: number;
  fullName: string;
  processedDate?: string; // Changed to string to match DTO
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    FontAwesomeModule,
    CustomTooltipDirective,
    ShimmerComponent,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerFadeInUp', [
      transition(':enter', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AdminDashboardComponent implements OnInit {
  totalEmployees = 0;
  pendingCount = 0;
  approvedCount = 0;
  pendingRequests: PendingRequest[] = [];
  recentApprovals: RecentApproval[] = [];

  isLoadingStats = false;
  statsError: string | null = null;

  isLoadingPendingRequests = false;
  pendingRequestsError: string | null = null;

  isLoadingApprovedRequests = false;
  approvedRequestsError: string | null = null;

  // Font Awesome Icons
  faPeopleGroup = faPeopleGroup;
  faMapLocationDot = faMapLocationDot;
  faHourglassHalf = faHourglassHalf;
  faCircleCheck = faCircleCheck;
  faArrowRight = faArrowRight;
  faArrowRightFromBracket = faArrowRightFromBracket;
  faCheck = faCheck;
  faXmark = faXmark;
  faInbox = faInbox;
  faUsers = faUsers;
  faUserCheck = faUserCheck;
  faDollarSign = faDollarSign;

  public authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  private loadingDialogRef: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private dashboardService: DashboardService,
    private requestService: RequestService,
  ) { }

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    // Fetch Dashboard Stats
    this.isLoadingStats = true;
    this.statsError = null;
    this.dashboardService.getDashboardStats().pipe(
      catchError(err => {
        this.statsError = this.translate.instant('ERROR.FAILED_TO_LOAD_DASHBOARD_STATISTICS');
        console.error('Error fetching dashboard stats:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        const data: DashboardStatsResponseData = response.data;
        this.totalEmployees = data.totalEmployees;
        this.pendingCount = data.pendingRequestsCount;
        this.approvedCount = data.approvedRequestsCount;
      } else if (!this.statsError) { // Only set if not already set by catchError
        this.statsError = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_DASHBOARD_STATISTICS');
      }
      this.isLoadingStats = false;
    });

    // Fetch Pending Requests
    this.isLoadingPendingRequests = true;
    this.pendingRequestsError = null;
    this.requestService.getRequests({ status: RequestStatus.Pending, pageNumber: 1, pageSize: 10 }).pipe(
      catchError(err => {
        this.pendingRequestsError = this.translate.instant('ERROR.FAILED_TO_LOAD_PENDING_REQUESTS');
        console.error('Error fetching pending requests:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.pendingRequests = response.data.requests;
      } else if (!this.pendingRequestsError) { // Only set if not already set by catchError
        this.pendingRequestsError = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_PENDING_REQUESTS');
      }
      this.isLoadingPendingRequests = false;
    });

    // Fetch Approved Requests
    this.isLoadingApprovedRequests = true;
    this.approvedRequestsError = null;
    this.requestService.getLatestApprovedRequests(RequestStatus.Approved).pipe(
      catchError(err => {
        this.approvedRequestsError = this.translate.instant('ERROR.FAILED_TO_LOAD_APPROVED_REQUESTS');
        console.error('Error fetching approved requests:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.recentApprovals = (response.data as LatestRequestsResponseData).requests;
      } else if (!this.approvedRequestsError) { // Only set if not already set by catchError
        this.approvedRequestsError = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_APPROVED_REQUESTS');
      }
      this.isLoadingApprovedRequests = false;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin-login']);
  }

  processRequest(id: number, isApproved: boolean): void {
    // Show loading dialog
    this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('LOADING.TITLE'),
        message: this.translate.instant('LOADING.PROCESSING_REQUEST'), // New translation key
        isSuccess: true // Use true for loading state to show spinner if implemented
      },
      disableClose: true // Prevent closing by clicking outside
    });

    this.requestService.processRequest(id, isApproved ? RequestStatus.Approved : RequestStatus.Rejected).subscribe({
      next: (response) => {
        // Close loading dialog
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
        }

        if (response.isSuccess) {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            data: {
              title: this.translate.instant('SUCCESS.TITLE'),
              message: this.translate.instant('SUCCESS.REQUEST_PROCESSED'), // New translation key
              isSuccess: true
            }
          });
          this.fetchDashboardData(); // Re-fetch data to update UI
        } else {
          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: response.message || this.translate.instant('ERROR.REQUEST_PROCESSING_FAILED'), // New translation key
              isSuccess: false
            }
          });
        }
      },
      error: (err) => {
        // Close loading dialog
        if (this.loadingDialogRef) {
          this.loadingDialogRef.close();
        }

        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: err.error?.message || err.message || this.translate.instant('ERROR.REQUEST_PROCESSING_ERROR'), // New translation key
            isSuccess: false
          }
        });
      }
    });
  }

  rejectRequest(request: PendingRequest): void {
    const dialogRef = this.dialog.open(RejectionReasonDialogComponent, {
      panelClass: 'glass-dialog-panel',
      backdropClass: 'transparent-backdrop',
      data: { fullName: request.fullName }
    });

    dialogRef.afterClosed().subscribe(rejectionReason => {
      if (rejectionReason !== null) { // User clicked OK or entered a reason (rejectionReason can be empty string)
        // Show loading dialog
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('LOADING.TITLE'),
            message: this.translate.instant('LOADING.PROCESSING_REQUEST'),
            isSuccess: true
          },
          disableClose: true
        });

        this.requestService.processRequest(request.id, RequestStatus.Rejected, rejectionReason).subscribe({
          next: (response) => {
            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
            }

            if (response.isSuccess) {
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                data: {
                  title: this.translate.instant('SUCCESS.TITLE'),
                  message: this.translate.instant('SUCCESS.REQUEST_PROCESSED'),
                  isSuccess: true
                }
              });
              this.fetchDashboardData(); // Re-fetch data to update UI
            } else {
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                data: {
                  title: this.translate.instant('ERROR.TITLE'),
                  message: response.message || this.translate.instant('ERROR.REQUEST_PROCESSING_FAILED'),
                  isSuccess: false
                }
              });
            }
          },
          error: (err) => {
            // Close loading dialog
            if (this.loadingDialogRef) {
              this.loadingDialogRef.close();
            }

            this.dialog.open(NotificationDialogComponent, {
              panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
              data: {
                title: this.translate.instant('ERROR.TITLE'),
                message: err.error?.message || err.message || this.translate.instant('ERROR.REQUEST_PROCESSING_ERROR'),
                isSuccess: false
              }
            });
          }
        });
      }
    });
  }
}
