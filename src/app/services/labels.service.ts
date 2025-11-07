// src/app/services/label.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface ListColumn {
  name: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'string' | 'number' | 'date' | 'array';
}

export interface RelationshipFilterConfig {
  relationshipType: string;
  relationshipDirection: 'IN' | 'OUT';
  targetLabel: string;
  alias?: string;
  placeholder?: string;
  attributeConfig?: RelationshipAttributeConfig[];
}

export interface RelationshipAttributeConfig {
  label: string;
  attribute: string;
  operator:
    | 'EQUALS'
    | 'GREATER_THAN'
    | 'LESS_THAN'
    | 'GREATER_EQUAL'
    | 'LESS_EQUAL';
  placeholder?: string;
  default: any;
  type: 'text' | 'number' | 'date';
}

export interface DisplayItem {
  iroko_uuid: string;
  name: string;
}

export interface FilterValue {
  ids: string[];
  attributeValues?: { [key: string]: { value: any; operator: string } };
}

export interface ListFilter {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'boolean' | 'relationship';
  placeholder?: string;
  options?: string[]; // For select/multiselect types
  relationshipConfig?: RelationshipFilterConfig;
}

export interface LabelsData {
  nodes: {
    [key: string]: {
      label: string;
      display: string;
      properties: ListColumn[];
      filters: ListFilter[];
    };
  };
  relationshipsAsTabs: { [key: string]: string };
  relationshipsAsProp: { [key: string]: string };
  searchIndices: { [key: string]: string };
}

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  private labelsData: LabelsData = {
    nodes: {},
    relationshipsAsTabs: {},
    relationshipsAsProp: {},
    searchIndices: {},
  };

  private labelsLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  loadData(): Observable<LabelsData> {
    return this.http.get('/labels.json').pipe(
      tap((data: any) => {
        this.labelsData.nodes = data.nodes;
        this.labelsData.relationshipsAsTabs = data.relationshipsAsTabs;
        this.labelsData.relationshipsAsProp = data.relationshipsAsProp;
        this.labelsData.searchIndices = data.searchIndices;
        this.labelsLoaded.next(true);
      })
    );
  }
  getLabelsData() {
    return this.labelsData;
  }
  getIndices() {
    return this.labelsData.searchIndices;
  }

  getRelationshipLabel(key: string): string {
    return (
      this.labelsData.relationshipsAsTabs[key] ||
      this.labelsData.relationshipsAsProp[key] ||
      key
    );
  }

  getNodeByPath(path: string) {
    return this.labelsData.nodes[path];
  }

  isLoaded(): Observable<boolean> {
    return this.labelsLoaded.asObservable();
  }
}
