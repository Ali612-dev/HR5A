import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit {
  @Input() totalCount: number = 0;
  @Input() request: any; // Assuming request has pageNumber and pageSize
  @Output() pageChange = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void { }

  onPageChange(pageNumber: number): void {
    console.log('🔄 Pagination: Page change requested:', {
      newPage: pageNumber,
      currentPage: this.request?.pageNumber,
      totalPages: this.totalPages,
      totalCount: this.totalCount
    });
    this.pageChange.emit(pageNumber);
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / (this.request?.pageSize ?? 10));
  }

  get pages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
