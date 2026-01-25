
import { Component, EventEmitter, Input, Output, ViewChild, TemplateRef, ElementRef, ViewContainerRef, HostBinding, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-dropdown.component.html',
  styleUrls: ['./custom-dropdown.component.css']
})
export class CustomDropdownComponent {
  @HostBinding('style.display') display = 'block';
  @HostBinding('style.width') width = '100%';
  @Input() options: { value: any; label: string }[] = [];
  @Input() selectedValue: any;
  @Output() selectionChange = new EventEmitter<any>();

  @ViewChild('dropdownMenu') dropdownMenu!: TemplateRef<any>;
  @ViewChild('toggleButton') toggleButton!: ElementRef;

  private overlayRef!: OverlayRef;

  private translate = inject(TranslateService);

  constructor(private overlay: Overlay, private viewContainerRef: ViewContainerRef) { }

  toggleDropdown() {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    } else {
      const positionStrategy = this.overlay.position()
        .flexibleConnectedTo(this.toggleButton)
        .withPositions([{
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        }]);

      const scrollStrategy = this.overlay.scrollStrategies.reposition();

      this.overlayRef = this.overlay.create({
        positionStrategy,
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
        scrollStrategy,
        width: this.toggleButton.nativeElement.getBoundingClientRect().width
      });

      this.overlayRef.backdropClick().subscribe(() => {
        this.overlayRef.detach();
      });

      const portal = new TemplatePortal(this.dropdownMenu, this.viewContainerRef);
      this.overlayRef.attach(portal);
    }
  }

  selectOption(value: any) {
    this.selectedValue = value;
    this.selectionChange.emit(value);
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }

  getSelectedLabel() {
    const selectedOption = this.options.find(option => option.value === this.selectedValue);
    return selectedOption ? this.translate.instant(selectedOption.label) : this.translate.instant('Select');
  }
}
