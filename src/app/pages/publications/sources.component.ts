import { Component, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import { GenericListComponent } from '../../components/generic-list/generic-list.component';
import {
  LabelsService,
  ListColumn,
  ListFilter,
} from '../../services/labels.service';

@Component({
  selector: 'app-publications',
  templateUrl: './publications.component.html',
  styleUrls: ['./publications.component.scss'],
  imports: [GenericListComponent, RouterModule],
})
export class PublicationsComponent {
  private metadataService = inject(MetadataService);
  private labelService = inject(LabelsService);

  sourceColumns: ListColumn[] = [];
  filters: ListFilter[] = [];

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Publicaciones',
      description:
        'Explora revistas, repositorios y fuentes de datos en el grafos de conocimiento',
      authors: [],
      subjects: [],
    });
    this.labelService.loadData().subscribe((labels) => {
      this.sourceColumns = labels.nodes['publication'].properties;
      this.filters = labels.nodes['publication'].filters;
    });
  }

  onNodeSelected(node: any) {
    console.log('Publication selected:', node);
    // Navigate to source detail or show dialog
  }
}
