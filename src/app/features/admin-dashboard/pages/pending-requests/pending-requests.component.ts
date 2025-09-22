import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faHourglassHalf, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { RequestService } from '../../../../core/request.service';
import { RequestStatus } from '../../../../core/interfaces/request.interface';
import { ShimmerComponent } from '../../../../shared/components/shimmer/shimmer.component';
import { CustomTooltipDirective } from '../../../../shared/directives/custom-tooltip.directive';
import { NotificationDialogComponent } from '../../../../shared/components/notification-dialog/notification-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-pending-requests',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FontAwesomeModule,
    ShimmerComponent,
    CustomTooltipDirective
  ],
  templateUrl: './pending-requests.component.html',
  styleUrls: ['./pending-requests.component.css']
})
export class PendingRequestsComponent implements OnInit {
  private requestService = inject(RequestService);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);

  // FontAwesome Icons
  faArrowLeft = faArrowLeft;
  faHourglassHalf = faHourglassHalf;
  faCheck = faCheck;
  faXmark = faXmark;

  // Data properties
  pendingRequests: any[] = [];
  isLoading = true;
  error: string | null = null;
  totalCount = 0;

  ngOnInit(): void {
    this.fetchPendingRequests();
  }

  fetchPendingRequests(): void {
    this.isLoading = true;
    this.error = null;
    
    this.requestService.getRequests({ 
      status: RequestStatus.Pending, 
      pageNumber: 1, 
      pageSize: 50 
    }).pipe(
      catchError(err => {
        this.error = this.translate.instant('ERROR.FAILED_TO_LOAD_PENDING_REQUESTS');
        console.error('Error fetching pending requests:', err);
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      if (response.isSuccess && response.data) {
        this.pendingRequests = response.data.requests;
        this.totalCount = response.data.totalCount;
      } else if (!this.error) {
        this.error = response.message || this.translate.instant('ERROR.UNKNOWN_ERROR_FETCHING_PENDING_REQUESTS');
      }
      this.isLoading = false;
    });
  }

  processRequest(requestId: number, approved: boolean): void {
    const status = approved ? RequestStatus.Approved : RequestStatus.Rejected;
    const loadingDialog = this.dialog.open(NotificationDialogComponent, {
      panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
      data: {
        title: this.translate.instant('LOADING.TITLE'),
        message: approved ? 
          this.translate.instant('LOADING.APPROVING_REQUEST') : 
          this.translate.instant('LOADING.REJECTING_REQUEST'),
        isSuccess: false
      },
      disableClose: true
    });

    this.requestService.processRequest(requestId, status).pipe(
      catchError(err => {
        loadingDialog.close();
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: this.translate.instant('ERROR.PROCESS_REQUEST_FAILED'),
            isSuccess: false
          }
        });
        return of({ isSuccess: false, data: null, message: this.translate.instant('ERROR.TITLE'), errors: [err] });
      })
    ).subscribe(response => {
      loadingDialog.close();
      
      if (response.isSuccess) {
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('SUCCESS.TITLE'),
            message: approved ? 
              this.translate.instant('SUCCESS.REQUEST_APPROVED') : 
              this.translate.instant('SUCCESS.REQUEST_REJECTED'),
            isSuccess: true
          }
        });
        this.fetchPendingRequests(); // Refresh the list
      } else {
        this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: this.translate.instant('ERROR.TITLE'),
            message: response.message || this.translate.instant('ERROR.PROCESS_REQUEST_FAILED'),
            isSuccess: false
          }
        });
      }
    });
  }

  rejectRequest(request: any): void {
    this.processRequest(request.id, false);
  }
}
