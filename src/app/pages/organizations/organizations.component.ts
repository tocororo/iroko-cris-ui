// src/app/pages/organizations/organizations.component.ts
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
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.scss'],
  imports: [GenericListComponent, RouterModule],
})
export class OrganizationsComponent {
  private metadataService = inject(MetadataService);
  private labelService = inject(LabelsService);

  organizationColumns: ListColumn[] = [];

  filters: ListFilter[] = [];

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Organizaciones',
      description: 'Explore organizations in the knowledge graph',
      authors: [],
      subjects: [],
    });
    this.labelService.loadData().subscribe((labels) => {
      this.organizationColumns = labels.nodes['organization'].properties;
      this.filters = labels.nodes['organization'].filters;
    });
  }

  onNodeSelected(node: any) {
    console.log('Organization selected:', node);
  }
}
