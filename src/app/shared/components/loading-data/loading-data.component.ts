import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-data',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './loading-data.component.html',
  styleUrls: ['./loading-data.component.css']
})
export class LoadingDataComponent {
  @Input() message: string = 'Loading';
  @Input() showSubtitle: boolean = true;
  @Input() spinnerDiameter: number = 60;
  @Input() minHeight: string = '400px';
}

