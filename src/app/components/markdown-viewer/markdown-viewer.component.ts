import { Component, Input, Output, EventEmitter } from '@angular/core';

import { MarkdownModule } from 'ngx-markdown';

export interface MarkdownError {
  message: string;
  originalError?: any;
}

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrls: ['./markdown-viewer.component.scss'],
  imports: [MarkdownModule],
})
export class MarkdownViewerComponent {
  @Input() content: string = '';
  @Input() src?: string;
  @Output() load = new EventEmitter<void>();
  @Output() error = new EventEmitter<MarkdownError>();

  onMarkdownLoad() {
    this.load.emit();
  }

  onMarkdownError(error: any) {
    const markdownError: MarkdownError = {
      message:
        typeof error === 'string'
          ? error
          : error?.message || 'Unknown error loading markdown',
      originalError: error,
    };
    this.error.emit(markdownError);
  }
}
