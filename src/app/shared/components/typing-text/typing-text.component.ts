import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-text',
  standalone: true,
  imports: [CommonModule],
  template: '{{ displayedText }}',
  styleUrls: ['./typing-text.component.css']
})
export class TypingTextComponent implements OnInit {
  @Input() text: string = '';
  @Input() delay: number = 100; // milliseconds per character

  displayedText: string = '';
  private currentIndex: number = 0;

  ngOnInit(): void {
    this.typeText();
  }

  private typeText(): void {
    if (this.currentIndex < this.text.length) {
      this.displayedText += this.text.charAt(this.currentIndex);
      this.currentIndex++;
      setTimeout(() => this.typeText(), this.delay);
    }
  }
}
