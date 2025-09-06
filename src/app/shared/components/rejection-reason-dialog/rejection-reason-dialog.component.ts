import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface RejectionReasonDialogData {
  fullName: string;
}

@Component({
  selector: 'app-rejection-reason-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './rejection-reason-dialog.component.html',
  styleUrls: ['./rejection-reason-dialog.component.css']
})
export class RejectionReasonDialogComponent {
  rejectionReason: string = '';

  constructor(
    public dialogRef: MatDialogRef<RejectionReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RejectionReasonDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(this.rejectionReason);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
