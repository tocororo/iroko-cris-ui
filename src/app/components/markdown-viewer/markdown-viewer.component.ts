// src/app/components/markdown-viewer/markdown-viewer.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrls: ['./markdown-viewer.component.scss'],
  imports: [CommonModule, MarkdownModule],
})
export class MarkdownViewerComponent {
  @Input() content: string = '';
  @Input() src?: string;
}
