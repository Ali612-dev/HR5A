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
    TranslateModule
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
    
    // Log current language for debugging
    console.log('Registration: Current language:', this.translate.currentLang);
    console.log('Registration: Default language:', this.translate.defaultLang);
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const registerRequest: RegisterRequest = this.registerForm.value;

      // Ensure translations are loaded before showing dialog
      this.translate.get(['LOADING.TITLE', 'LOADING.REGISTER_EMPLOYEE']).subscribe(translations => {
        const loadingTitle = translations['LOADING.TITLE'];
        const loadingMessage = translations['LOADING.REGISTER_EMPLOYEE'];
        
        console.log('Registration: Loading dialog translations:', { loadingTitle, loadingMessage });

        // Show loading dialog
        this.loadingDialogRef = this.dialog.open(NotificationDialogComponent, {
          panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
          data: {
            title: loadingTitle,
            message: loadingMessage,
            isSuccess: true // Use true for loading state to show spinner if implemented
          },
          disableClose: true // Prevent closing by clicking outside
        });

        // Log the current language before making API call
        console.log('Registration: Current language before API call:', this.translate.currentLang);
        console.log('Registration: Register request data:', registerRequest);
        
        // Make API call after dialog is shown
        this.authService.register(registerRequest).subscribe({
        next: (response) => {
          // Close loading dialog
          if (this.loadingDialogRef) {
            this.loadingDialogRef.close();
          }

          if (response.isSuccess) {
            this.translate.get(['SUCCESS.TITLE', 'SUCCESS.REGISTER_EMPLOYEE']).subscribe(translations => {
              const successTitle = translations['SUCCESS.TITLE'];
              const successMessage = translations['SUCCESS.REGISTER_EMPLOYEE'];
              
              console.log('Registration: Success dialog translations:', { successTitle, successMessage });
              
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                data: {
                  title: successTitle,
                  message: successMessage,
                  isSuccess: true
                }
              });
            });
            
          } else {
            this.translate.get(['ERROR.TITLE', 'ERROR.REGISTER_EMPLOYEE_FAILED']).subscribe(translations => {
              const errorTitle = translations['ERROR.TITLE'];
              const errorMessage = response.message || translations['ERROR.REGISTER_EMPLOYEE_FAILED'];
              
              console.log('Registration: Error dialog translations:', { errorTitle, errorMessage });
              
              this.dialog.open(NotificationDialogComponent, {
                panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
                data: {
                  title: errorTitle,
                  message: errorMessage,
                  isSuccess: false
                }
              });
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          // Close loading dialog
          if (this.loadingDialogRef) {
            this.loadingDialogRef.close();
          }

          this.translate.get(['ERROR.TITLE', 'ERROR.REGISTER_EMPLOYEE_ERROR', 'ERROR.SERVER_ERROR']).subscribe(translations => {
            let errorMessage = translations['ERROR.REGISTER_EMPLOYEE_ERROR'];

            if (error.status === 500) {
              errorMessage = translations['ERROR.SERVER_ERROR'];
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }

            const errorTitle = translations['ERROR.TITLE'];
            
            console.log('Registration: Error handler dialog translations:', { errorTitle, errorMessage });

            this.dialog.open(NotificationDialogComponent, {
              panelClass: ['glass-dialog-panel', 'transparent-backdrop'],
              data: {
                title: errorTitle,
                message: errorMessage,
                isSuccess: false
              }
            });
          });
        }
        });
      });
    } else {
      this.translate.get('PleaseFillAllRequiredFields').subscribe(validationMessage => {
        console.log('Registration: Validation error message:', validationMessage);
        alert(validationMessage);
      });
    }
  }
}