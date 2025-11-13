import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faTimes, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, FontAwesomeModule],
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.css']
})
export class TimePickerComponent implements OnInit {
  @Input() value: string = ''; // HH:mm format
  @Input() label: string = '';
  @Output() timeChange = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  private translate = inject(TranslateService);

  faClock = faClock;
  faTimes = faTimes;
  faChevronUp = faChevronUp;
  faChevronDown = faChevronDown;

  hours: number[] = [];
  minutes: number[] = [];
  selectedHour: number = 0;
  selectedMinute: number = 0;
  hourInput: string = '00';
  minuteInput: string = '00';

  quickTimes: { label: string; hour: number; minute: number }[] = [
    { label: 'Morning', hour: 8, minute: 0 },
    { label: 'Noon', hour: 12, minute: 0 },
    { label: 'Afternoon', hour: 14, minute: 0 },
    { label: 'Evening', hour: 18, minute: 0 },
    { label: 'Night', hour: 22, minute: 0 }
  ];

  ngOnInit(): void {
    // Generate hours (0-23)
    this.hours = Array.from({ length: 24 }, (_, i) => i);
    // Generate minutes (0-59 for full range with scrollable selection)
    this.minutes = Array.from({ length: 60 }, (_, i) => i);
    
    // Parse initial value
    if (this.value) {
      const [hour, minute] = this.value.split(':').map(Number);
      this.selectedHour = hour || 0;
      this.selectedMinute = minute || 0;
      this.updateInputFields();
      this.scrollToSelected();
    } else {
      const now = new Date();
      this.selectedHour = now.getHours();
      this.selectedMinute = now.getMinutes();
      this.updateInputFields();
      this.scrollToSelected();
    }
  }

  updateInputFields(): void {
    this.hourInput = this.formatHour(this.selectedHour);
    this.minuteInput = this.formatMinute(this.selectedMinute);
  }

  selectHour(hour: number): void {
    this.selectedHour = hour;
    this.updateInputFields();
    this.scrollToSelected();
    this.emitTime();
  }

  selectMinute(minute: number): void {
    this.selectedMinute = minute;
    this.updateInputFields();
    this.scrollToSelected();
    this.emitTime();
  }

  onHourInputChange(value: string): void {
    const hour = parseInt(value, 10);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      this.selectedHour = hour;
      this.updateInputFields();
      this.emitTime();
    } else if (value === '') {
      this.hourInput = '';
    } else {
      // Invalid, revert to current value
      this.updateInputFields();
    }
  }

  onMinuteInputChange(value: string): void {
    const minute = parseInt(value, 10);
    if (!isNaN(minute) && minute >= 0 && minute <= 59) {
      this.selectedMinute = minute;
      this.updateInputFields();
      this.emitTime();
    } else if (value === '') {
      this.minuteInput = '';
    } else {
      // Invalid, revert to current value
      this.updateInputFields();
    }
  }

  onHourInputBlur(): void {
    // Validate and normalize on blur
    const hour = parseInt(this.hourInput, 10);
    if (isNaN(hour) || hour < 0) {
      this.selectedHour = 0;
    } else if (hour > 23) {
      this.selectedHour = 23;
    } else {
      this.selectedHour = hour;
    }
    this.updateInputFields();
    this.emitTime();
  }

  onMinuteInputBlur(): void {
    // Validate and normalize on blur
    let minute = parseInt(this.minuteInput, 10);
    if (isNaN(minute) || minute < 0) {
      minute = 0;
    } else if (minute >= 60) {
      // If minute is 60 or more, convert to hours and minutes
      // Example: 60 minutes = 1 hour, so 15:60 becomes 16:00
      const additionalHours = Math.floor(minute / 60);
      minute = minute % 60;
      const newHour = this.selectedHour + additionalHours;
      this.selectedHour = Math.min(23, newHour); // Cap at 23 hours
    } else {
      minute = Math.min(59, minute); // Cap at 59 minutes
    }
    this.selectedMinute = minute;
    this.updateInputFields();
    this.emitTime();
  }

  selectQuickTime(hour: number, minute: number): void {
    this.selectedHour = hour;
    this.selectedMinute = minute;
    this.updateInputFields();
    this.scrollToSelected();
    this.emitTime();
  }

  setCurrentTime(): void {
    const now = new Date();
    this.selectedHour = now.getHours();
    this.selectedMinute = now.getMinutes();
    this.updateInputFields();
    this.scrollToSelected();
    this.emitTime();
  }

  scrollToSelected(): void {
    // Scroll to selected items after a short delay to ensure DOM is ready
    setTimeout(() => {
      const hourList = document.querySelector('.hours-list') as HTMLElement;
      const minuteList = document.querySelector('.minutes-list') as HTMLElement;
      const hourElement = document.querySelector(`.hours-list .time-item.selected`) as HTMLElement;
      const minuteElement = document.querySelector(`.minutes-list .time-item.selected`) as HTMLElement;
      
      if (hourElement && hourList) {
        // Calculate scroll position to center the element
        const elementTop = hourElement.offsetTop;
        const elementHeight = hourElement.offsetHeight;
        const listHeight = hourList.clientHeight;
        const scrollPosition = elementTop - (listHeight / 2) + (elementHeight / 2);
        
        // Use requestAnimationFrame for smooth scrolling without blocking
        requestAnimationFrame(() => {
          hourList.scrollTop = Math.max(0, Math.min(scrollPosition, hourList.scrollHeight - hourList.clientHeight));
        });
      }
      
      if (minuteElement && minuteList) {
        // Calculate scroll position to center the element
        const elementTop = minuteElement.offsetTop;
        const elementHeight = minuteElement.offsetHeight;
        const listHeight = minuteList.clientHeight;
        const scrollPosition = elementTop - (listHeight / 2) + (elementHeight / 2);
        
        // Use requestAnimationFrame for smooth scrolling without blocking
        requestAnimationFrame(() => {
          minuteList.scrollTop = Math.max(0, Math.min(scrollPosition, minuteList.scrollHeight - minuteList.clientHeight));
        });
      }
    }, 250);
  }

  private emitTime(): void {
    const timeString = `${this.selectedHour.toString().padStart(2, '0')}:${this.selectedMinute.toString().padStart(2, '0')}`;
    this.timeChange.emit(timeString);
  }

  onClose(): void {
    this.close.emit();
  }

  formatHour(hour: number): string {
    return hour.toString().padStart(2, '0');
  }

  formatMinute(minute: number): string {
    return minute.toString().padStart(2, '0');
  }

  getTimeDisplay(): string {
    return `${this.formatHour(this.selectedHour)}:${this.formatMinute(this.selectedMinute)}`;
  }

  incrementHour(): void {
    this.selectedHour = (this.selectedHour + 1) % 24;
    this.updateInputFields();
    this.scrollToSelected();
    this.emitTime();
  }

  decrementHour(): void {
    this.selectedHour = this.selectedHour === 0 ? 23 : this.selectedHour - 1;
    this.updateInputFields();
    this.scrollToSelected();
    this.emitTime();
  }

  incrementMinute(): void {
    let newMinute = this.selectedMinute + 1;
    if (newMinute >= 60) {
      newMinute = 0;
      this.selectedHour = (this.selectedHour + 1) % 24;
    }
    this.selectedMinute = newMinute;
    this.updateInputFields();
    this.scrollToSelected();
    this.emitTime();
  }

  decrementMinute(): void {
    let newMinute = this.selectedMinute - 1;
    if (newMinute < 0) {
      newMinute = 59;
      this.selectedHour = this.selectedHour === 0 ? 23 : this.selectedHour - 1;
    }
    this.selectedMinute = newMinute;
    this.updateInputFields();
    this.scrollToSelected();
    this.emitTime();
  }
}

