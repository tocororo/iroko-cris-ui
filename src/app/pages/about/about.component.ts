import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  MarkdownViewerComponent,
  MarkdownError,
} from '../../components/markdown-viewer/markdown-viewer.component';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  imports: [
    RouterModule,
    MarkdownViewerComponent,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIcon
],
})
export class AboutComponent implements OnInit {
  private metadataService = inject(MetadataService);

  isLoading = true;
  loadError = false;
  errorMessage = '';

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Acerca de Sceiba',
      description: 'Acerca de Sceiba, publicaciones cientificas cubanas',
      authors: [],
      subjects: [],
    });
  }

  onMarkdownLoad() {
    this.isLoading = false;
    this.loadError = false;
  }

  onMarkdownError(error: MarkdownError) {
    this.isLoading = false;
    this.loadError = true;
    this.errorMessage = error.message;
  }
}
