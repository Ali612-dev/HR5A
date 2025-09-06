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
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            console.log('Login successful!', response.data);
            this.router.navigate(['/admin-dashboard']); // Navigate to admin-dashboard page on success
          } else {
            // Show smart dialog with localized error from response.message
            const errorMessage = response.message || this.translate.instant('ERROR.UNKNOWN_LOGIN_ERROR');
            this.openErrorDialog(errorMessage);
          }
        },
        error: (err: HttpErrorResponse) => { // Type err as HttpErrorResponse
          let displayMessage: string;
          if (err.status === 0) {
            displayMessage = 'ERROR.SERVER_NOT_AVAILABLE';
          }
          else if (err.status === 401) {
            displayMessage = 'ERROR.UNAUTHORIZED_LOGIN';
          } else if (err.error && typeof err.error.message === 'string') {
            displayMessage = err.error.message;
          } else if (err.status >= 500) {
            displayMessage = 'ERROR.SERVER_ERROR';
          }
          else if (err.message) {
            displayMessage = err.message;
          } else {
            displayMessage = 'ERROR.UNKNOWN_LOGIN_ERROR';
          }
          this.openErrorDialog(displayMessage); // Pass the message/key to the dialog
        }
      });
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
