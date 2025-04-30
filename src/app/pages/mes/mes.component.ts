import { Component } from '@angular/core';
import { MetadataService } from '../../services/metadata.service';

@Component({
  selector: 'app-mes',
  imports: [],
  templateUrl: './mes.component.html',
  styleUrl: './mes.component.scss',
})
export class MesComponent {
  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Revistas MES',
      description: 'iroko-cris - Revistas MES',
      authors: [],
      subjects: [],
    });
  }

  ngOnDestroy() {
    this.metadataService.resetMetadata();
  }
}
