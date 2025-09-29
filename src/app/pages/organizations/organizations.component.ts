// src/app/pages/organizations/organizations.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class OrganizationsComponent {
  organizationColumns: ListColumn[] = [
    {
      name: 'id',
      label: 'ID',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'types',
      label: 'Types',
      sortable: true,
      filterable: true,
      type: 'array',
    },
    {
      name: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'acronyms',
      label: 'Acronyms',
      sortable: false,
      filterable: true,
      type: 'array',
    },
    {
      name: 'established',
      label: 'Established',
      sortable: true,
      filterable: false,
      type: 'date',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'Organizations',
      description: 'Explore organizations in the knowledge graph',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('Organization selected:', node);
    // You can navigate to a detail view or show a dialog here
  }
}
