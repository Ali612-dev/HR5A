
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService {
  private isMobileSubject = new BehaviorSubject<boolean>(false);
  isMobile$: Observable<boolean> = this.isMobileSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // Initial check
      this.checkScreenSize();

      // Listen to window resize events
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(100), // Debounce to avoid excessive calls
          map(() => window.innerWidth < 1024), // Define mobile breakpoint
          startWith(window.innerWidth < 1024) // Emit initial value
        )
        .subscribe(isMobile => {
          this.isMobileSubject.next(isMobile);
        });
    }
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileSubject.next(window.innerWidth < 1024);
    }
  }
}
