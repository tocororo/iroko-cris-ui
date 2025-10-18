// src/app/pages/organizations/organizations.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListFilter,
} from '../../components/generic-list/generic-list.component';
import { LabelsService, ListColumn } from '../../services/labels.service';

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class OrganizationsComponent {
  organizationColumns: ListColumn[] = [];

  organizationFilters: ListFilter[] = [
    {
      name: 'organizationType',
      label: 'Tipo de Organización',
      type: 'multiselect',
      options: [
        'Education',
        'Healthcare',
        'Company',
        'Nonprofit',
        'Government',
      ],
    },
  ];
  constructor(
    private metadataService: MetadataService,
    private labelService: LabelsService
  ) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Organizaciones',
      description: 'Explore organizations in the knowledge graph',
      authors: [],
      subjects: [],
    });
    this.labelService.loadData().subscribe((labels) => {
      this.organizationColumns = labels.nodes['organization'].properties;
    });
  }

  onNodeSelected(node: any) {
    console.log('Organization selected:', node);
  }
}
