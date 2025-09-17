import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth.service';
import { RegisterRequest } from '../../../core/interfaces/auth.interface';
import { MatDialog } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../../../shared/components/notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    NotificationDialogComponent
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private loadingDialogRef: any;

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      cardNumber: ['', Validators.required],
      email: ['', [Validators.email]],
      department: ['']
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const registerRequest: RegisterRequest = this.registerForm.value;

      // Show loading dialog
      this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
        panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
        data: {
          title: this.translate.instant('LOADING.TITLE'),
          message: this.translate.instant('LOADING.REGISTER_EMPLOYEE'),
          isSuccess: true // Use true for loading state to show spinner if implemented
        },
        disableClose: true // Prevent closing by clicking outside
      });

      this.authService.register(registerRequest).subscribe({
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
                message: this.translate.instant('SUCCESS.REGISTER_EMPLOYEE'),
                isSuccess: true
              }
            });
            
          } else {
                      this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: response.message || this.translate.instant('ERROR.REGISTER_EMPLOYEE_FAILED'),
              isSuccess: false
            }
          });
          }
        },
        error: (error: HttpErrorResponse) => {
          // Close loading dialog
          if (this.loadingDialogRef) {
            this.loadingDialogRef.close();
          }

          let errorMessage = this.translate.instant('ERROR.REGISTER_EMPLOYEE_ERROR');

          if (error.status === 500) {
            errorMessage = this.translate.instant('ERROR.SERVER_ERROR');
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.dialog.open(NotificationDialogComponent, {
            panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
            data: {
              title: this.translate.instant('ERROR.TITLE'),
              message: errorMessage,
              isSuccess: false
            }
          });
        }
      });
    } else {
      alert(this.translate.instant('PleaseFillAllRequiredFields'));
    }
  }
}