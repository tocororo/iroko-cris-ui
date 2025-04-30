import { Component } from '@angular/core';
import { MetadataService } from '../../services/metadata.service';

@Component({
  selector: 'app-sources',
  imports: [],
  templateUrl: './sources.component.html',
  styleUrl: './sources.component.scss',
})
export class SourcesComponent {
  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Sources',
      description: 'iroko-cris - Sources page',
      authors: [],
      subjects: [],
    });
  }

  ngOnDestroy() {
    this.metadataService.resetMetadata();
  }
}
