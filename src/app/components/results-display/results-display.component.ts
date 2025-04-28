import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@Component({
  selector: 'app-results-display',
  templateUrl: './results-display.component.html',
  styleUrls: ['./results-display.component.scss'],
  imports: [NgxJsonViewerModule, CommonModule],
})
export class ResultsDisplayComponent {
  @Input() queryResult: any;
  @Input() error: any;
}
