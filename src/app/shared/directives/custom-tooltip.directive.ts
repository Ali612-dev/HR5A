import { Directive, Input, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Directive({
  selector: '[appCustomTooltip]',
  standalone: true,
})
export class CustomTooltipDirective {
  @Input('appCustomTooltipText') tooltipText: string = '';
  private tooltipElement: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private translate: TranslateService
  ) { }

  @HostListener('mouseenter') onMouseEnter() {
    this.createTooltip();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.removeTooltip();
  }

  private createTooltip() {
    if (this.tooltipElement) return;

    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'custom-tooltip');
    // Append to document.body for fixed positioning relative to viewport
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Set text and translate it
    if (this.tooltipElement) {
      this.tooltipElement.innerText = this.translate.instant(this.tooltipText);
    }

    // Position the tooltip relative to the viewport
    const hostRect = this.el.nativeElement.getBoundingClientRect(); // Button's rect

    // Ensure tooltipElement is not null before getting its dimensions
    if (!this.tooltipElement) return; // Should not happen here, but for type safety

    const tooltipRect = this.tooltipElement.getBoundingClientRect(); // Tooltip's dimensions

    // Calculate top and left relative to the viewport
    const top = hostRect.top - tooltipRect.height - 10; // 10px offset above button
    const left = hostRect.left + (hostRect.width / 2) - (tooltipRect.width / 2);

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);

    // Trigger visibility after positioning
    setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.addClass(this.tooltipElement, 'tooltip-visible');
      }
    }, 0);
  }

  private removeTooltip() {
    if (this.tooltipElement) {
      this.renderer.removeClass(this.tooltipElement, 'tooltip-visible');

      setTimeout(() => {
        if (this.tooltipElement) {
          this.renderer.removeChild(document.body, this.tooltipElement);
          this.tooltipElement = null;
        }
      }, 150); // Match CSS transition duration
    }
  }
}
