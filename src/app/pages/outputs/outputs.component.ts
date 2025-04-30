import { Component } from '@angular/core';
import { MetadataService } from '../../services/metadata.service';

@Component({
  selector: 'app-outputs',
  imports: [],
  templateUrl: './outputs.component.html',
  styleUrl: './outputs.component.scss',
})
export class OutputsComponent {
  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Outputs',
      description: 'iroko-cris - Outputs page',
      authors: [],
      subjects: [],
    });
  }

  ngOnDestroy() {
    this.metadataService.resetMetadata();
  }
}
