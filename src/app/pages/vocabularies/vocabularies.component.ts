import { Component } from '@angular/core';
import { MetadataService } from '../../services/metadata.service';

@Component({
  selector: 'app-vocabularies',
  imports: [],
  templateUrl: './vocabularies.component.html',
  styleUrl: './vocabularies.component.scss',
})
export class VocabulariesComponent {
  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Vocabularies',
      description: 'iroko-cris - Vocabularies page',
      authors: [],
      subjects: [],
    });
  }

  ngOnDestroy() {
    this.metadataService.resetMetadata();
  }
}
