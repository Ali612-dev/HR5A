import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-data',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './empty-data.component.html',
  styleUrls: ['./empty-data.component.css']
})
export class EmptyDataComponent {
  @Input() title: string = 'NoDataAvailable';
  @Input() description: string = '';
  @Input() icon: string = 'inbox';
  @Input() showAction: boolean = false;
  @Input() actionLabel: string = '';
  @Input() actionIcon: string = 'add';
  
  @Output() actionClick = new EventEmitter<void>();
  
  onActionClick(): void {
    this.actionClick.emit();
  }
}

