export interface ListColumn {
  name: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'string' | 'number' | 'date' | 'array';
}

export interface DisplayItem {
  iroko_uuid: string;
  name: string;
}

export interface FilterValue {
  ids: string[];
  attributeValues?: { [key: string]: { value: any; operator: string } };
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

export interface ListFilter {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'boolean' | 'relationship';
  placeholder?: string;
  options?: string[];
  relationshipConfig?: RelationshipFilterConfig;
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
