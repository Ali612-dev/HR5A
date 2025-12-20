
import { MatDialog } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { RejectionReasonDialogComponent } from '../../../../shared/components/rejection-reason-dialog/rejection-reason-dialog.component';
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
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
  faDollarSign,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { trigger, state, style, animate, transition, query, stagger } from '@angular/animations';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { CustomTooltipDirective } from '../../../../shared/directives/custom-tooltip.directive';
import { DashboardService } from '../../../../core/dashboard.service';
import { DashboardStatsResponseData } from '../../../../core/interfaces/dashboard.interface';
import { RequestService } from '../../../../core/request.service';
import { RequestDto, RequestStatus, LatestRequestsResponseData } from '../../../../core/interfaces/request.interface';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('employeesChart') employeesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pendingRequestsChart') pendingRequestsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('approvedRequestsChart') approvedRequestsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyTrendsChart') monthlyTrendsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('requestsStatusChart') requestsStatusChartRef!: ElementRef<HTMLCanvasElement>;
  
  private charts: Chart[] = [];
  private cdr = inject(ChangeDetectorRef);

  totalEmployees = 0;
  pendingCount = 0;
  approvedCount = 0;

  isLoadingStats = false;
  statsError: string | null = null;

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
  faChartLine = faChartLine;

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
      // Initialize charts after data is loaded
      setTimeout(() => {
        this.initializeCharts();
      }, 300);
    });
  }

  refreshData(): void {
    this.fetchDashboardData();
    // Reinitialize charts after refresh
    setTimeout(() => {
      this.initializeCharts();
    }, 500);
  }

  ngAfterViewInit(): void {
    // Wait for view to be fully initialized
    this.cdr.detectChanges();
    // Try multiple times to ensure canvas elements are ready
    let attempts = 0;
    const maxAttempts = 10;
    const tryInit = () => {
      attempts++;
      if (this.employeesChartRef?.nativeElement && 
          this.attendanceChartRef?.nativeElement &&
          this.pendingRequestsChartRef?.nativeElement &&
          this.approvedRequestsChartRef?.nativeElement &&
          this.monthlyTrendsChartRef?.nativeElement &&
          this.requestsStatusChartRef?.nativeElement) {
        this.initializeCharts();
      } else if (attempts < maxAttempts) {
        setTimeout(tryInit, 150);
      } else {
        console.warn('Charts initialization failed after multiple attempts');
        // Try to initialize anyway with available charts
        this.initializeCharts();
      }
    };
    setTimeout(tryInit, 500);
  }

  ngOnDestroy(): void {
    // Destroy all charts
    this.charts.forEach(chart => {
      try {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
    });
    this.charts = [];
  }

  initializeCharts(): void {
    // Destroy existing charts first
    this.charts.forEach(chart => {
      try {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
    });
    this.charts = [];

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Initialize all charts
      this.createEmployeesChart();
      this.createAttendanceChart();
      this.createPendingRequestsChart();
      this.createApprovedRequestsChart();
      this.createMonthlyTrendsChart();
      this.createRequestsStatusChart();
    });
  }

  createEmployeesChart(): void {
    if (!this.employeesChartRef?.nativeElement) {
      console.warn('Employees Chart canvas not found');
      return;
    }
    
    const existingChart = Chart.getChart(this.employeesChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const ctx = this.employeesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    try {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: this.translate.instant('TotalEmployees'),
            data: [120, 135, 150, 145, 160, 175],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Employees Chart:', error);
    }
  }

  createAttendanceChart(): void {
    if (!this.attendanceChartRef?.nativeElement) {
      console.warn('Attendance Chart canvas not found');
      return;
    }
    
    const existingChart = Chart.getChart(this.attendanceChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const ctx = this.attendanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    try {
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [
            this.translate.instant('Present'),
            this.translate.instant('Absent'),
            this.translate.instant('Late')
          ],
          datasets: [{
            data: [85, 10, 5],
            backgroundColor: [
              '#f97316',
              '#ea580c',
              '#fb923c'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'left'
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Attendance Chart:', error);
    }
  }

  createPendingRequestsChart(): void {
    if (!this.pendingRequestsChartRef?.nativeElement) {
      console.warn('Pending Requests Chart canvas not found');
      return;
    }
    
    const existingChart = Chart.getChart(this.pendingRequestsChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const ctx = this.pendingRequestsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    try {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: this.translate.instant('PendingRequests'),
            data: [15, 20, 18, 25],
            backgroundColor: [
              '#f97316',
              '#ea580c',
              '#fb923c',
              '#fdba74'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Pending Requests Chart:', error);
    }
  }

  createApprovedRequestsChart(): void {
    if (!this.approvedRequestsChartRef?.nativeElement) {
      console.warn('Approved Requests Chart canvas not found');
      return;
    }
    
    const existingChart = Chart.getChart(this.approvedRequestsChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const ctx = this.approvedRequestsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    try {
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [
            this.translate.instant('Approved'),
            this.translate.instant('Rejected'),
            this.translate.instant('Pending')
          ],
          datasets: [{
            data: [60, 20, 20],
            backgroundColor: [
              '#f97316',
              '#ea580c',
              '#fb923c'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'left'
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Approved Requests Chart:', error);
    }
  }

  createMonthlyTrendsChart(): void {
    if (!this.monthlyTrendsChartRef?.nativeElement) {
      console.warn('Monthly Trends Chart canvas not found');
      return;
    }
    
    const existingChart = Chart.getChart(this.monthlyTrendsChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const ctx = this.monthlyTrendsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    try {
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: this.translate.instant('MonthlyTrends'),
            data: [100, 120, 115, 130, 125, 140],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Monthly Trends Chart:', error);
    }
  }

  createRequestsStatusChart(): void {
    if (!this.requestsStatusChartRef?.nativeElement) {
      console.warn('Requests Status Chart canvas not found');
      return;
    }
    
    const existingChart = Chart.getChart(this.requestsStatusChartRef.nativeElement);
    if (existingChart) {
      existingChart.destroy();
    }
    
    const ctx = this.requestsStatusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    try {
      const chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: [
            this.translate.instant('Pending'),
            this.translate.instant('Approved'),
            this.translate.instant('Rejected'),
            this.translate.instant('Processing'),
            this.translate.instant('Completed')
          ],
          datasets: [{
            label: this.translate.instant('RequestsStatus'),
            data: [25, 60, 15, 10, 40],
            backgroundColor: 'rgba(249, 115, 22, 0.2)',
            borderColor: '#f97316',
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#f97316'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error('Error creating Requests Status Chart:', error);
    }
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
