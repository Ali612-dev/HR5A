import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shimmer',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="shimmer-wrapper"><div class="shimmer"></div></div>',
  styleUrls: ['./shimmer.component.css']
})
export class ShimmerComponent { }
