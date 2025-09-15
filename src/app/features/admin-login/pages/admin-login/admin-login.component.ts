import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth.service';
import { AuthStore } from '../../../../store/auth.store';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Import MatDialog and MatDialogModule
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component'; // Import ErrorDialogComponent
import { HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    
    TranslatePipe,
    ReactiveFormsModule,
    MatDialogModule // Add MatDialogModule to imports
  ],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLoginComponent implements OnInit {
  loginForm!: FormGroup;
  public authStore = inject(AuthStore);
  showGoToDashboardButton = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private dialog: MatDialog // Inject MatDialog
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.checkTokenAndRedirect();
  }

  checkTokenAndRedirect(): void {
    const token = this.authStore.token();
    if (token && !this.authService.isTokenExpired(token)) {
      this.showGoToDashboardButton.set(true);
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.showGoToDashboardButton.set(false);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('🔐 Starting login attempt...');
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('📡 Login response received:', response);
          if (response.isSuccess) {
            console.log('✅ Login successful!', response.data);
            this.router.navigate(['/admin-dashboard']);
          } else {
            console.log('❌ Login failed - server returned isSuccess: false');
            // Show actual server message if available
            const errorMessage = response.message || 
                                response.errors?.join(', ') || 
                                this.translate.instant('ERROR.UNKNOWN_LOGIN_ERROR');
            console.log('Error message to display:', errorMessage);
            this.openErrorDialog(errorMessage);
          }
        },
        error: (err: HttpErrorResponse) => {
          console.log('🚨 Login HTTP error:', err);
          console.log('Error status:', err.status);
          console.log('Error body:', err.error);
          
          let displayMessage: string;
          
          // Check if it's a network connectivity issue
          if (err.status === 0) {
            displayMessage = this.translate.instant('ERROR.SERVER_NOT_AVAILABLE');
          }
          // Check for specific HTTP status codes
          else if (err.status === 401) {
            // Try to get the actual message from server
            if (err.error && err.error.message) {
              displayMessage = err.error.message;
            } else {
              displayMessage = this.translate.instant('ERROR.UNAUTHORIZED_LOGIN');
            }
          } 
          else if (err.status === 400) {
            // Bad request - show server message if available
            if (err.error && err.error.message) {
              displayMessage = err.error.message;
            } else if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
              displayMessage = err.error.errors.join(', ');
            } else {
              displayMessage = this.translate.instant('ERROR.BAD_REQUEST');
            }
          }
          else if (err.status >= 500) {
            displayMessage = this.translate.instant('ERROR.SERVER_ERROR');
          }
          // Try to extract message from error response
          else if (err.error && typeof err.error.message === 'string') {
            displayMessage = err.error.message;
          } 
          else if (err.message) {
            displayMessage = err.message;
          } 
          else {
            displayMessage = this.translate.instant('ERROR.UNKNOWN_LOGIN_ERROR');
          }
          
          console.log('Final error message to display:', displayMessage);
          this.openErrorDialog(displayMessage);
        }
      });
    } else {
      console.log('⚠️ Form is invalid');
    }
  }

  // Method to open the custom error dialog
  openErrorDialog(message: string): void {
    let dialogMessage: string;
    if (message.startsWith('ERROR.')) {
      dialogMessage = this.translate.instant(message);
    } else {
      dialogMessage = message;
    }

    const dialogTitle = this.translate.instant('ERROR.TITLE');

    this.dialog.open(ErrorDialogComponent, {
      data: { title: dialogTitle, message: dialogMessage },
      panelClass: ['glass-dialog-panel', 'magical-error-dialog'],
      backdropClass: 'transparent-backdrop',
      width: '350px' // You can adjust the width
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/admin-dashboard']);
  }
}
