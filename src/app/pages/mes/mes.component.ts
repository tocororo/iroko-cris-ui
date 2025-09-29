// src/app/pages/mes/mes.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataService } from '../../services/metadata.service';
import {
  GenericListComponent,
  ListColumn,
} from '../../components/generic-list/generic-list.component';

@Component({
  selector: 'app-mes',
  templateUrl: './mes.component.html',
  styleUrls: ['./mes.component.scss'],
  imports: [CommonModule, GenericListComponent, RouterModule],
})
export class MesComponent {
  mesColumns: ListColumn[] = [
    {
      name: 'id',
      label: 'ID',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'title',
      label: 'Journal Title',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'name',
      label: 'Short Name',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'issn',
      label: 'ISSN',
      sortable: false,
      filterable: true,
      type: 'string',
    },
    {
      name: 'rnps',
      label: 'RNPS',
      sortable: false,
      filterable: true,
      type: 'string',
    },
    {
      name: 'seriadas_cubanas',
      label: 'Seriadas Cubanas',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'source_status',
      label: 'Status',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'start_year',
      label: 'Start Year',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'frequency',
      label: 'Frequency',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      name: 'organizations',
      label: 'Publisher Organizations',
      sortable: false,
      filterable: true,
      type: 'array',
    },
  ];

  constructor(private metadataService: MetadataService) {}

  ngOnInit() {
    this.metadataService.updateMetadata({
      title: 'MES Journals',
      description:
        'Explore scientific journals from the Cuban Ministry of Higher Education',
      authors: [],
      subjects: [],
    });
  }

  onNodeSelected(node: any) {
    console.log('MES journal selected:', node);
    // Navigate to journal detail or show dialog
  }
}
