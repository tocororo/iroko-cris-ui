import { Component, Input, input, output } from '@angular/core';

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
  readonly content = input<string>('');
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() src?: string;
  readonly load = output<void>();
  readonly error = output<MarkdownError>();

  onMarkdownLoad() {
    // TODO: The 'emit' function requires a mandatory void argument
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
