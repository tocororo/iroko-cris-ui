import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class PublicationsComponent {
  sourceColumns: ListColumn[] = [];
  filters: ListFilter[] = [];

  constructor(
    private metadataService: MetadataService,
    private labelService: LabelsService
  ) {}

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
