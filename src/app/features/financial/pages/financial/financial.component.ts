import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './financial.html',
  styleUrl: './financial.css'
})
export class FinancialComponent {

}