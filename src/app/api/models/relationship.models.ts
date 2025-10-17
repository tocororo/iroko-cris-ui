export interface RelationshipGroup {
  type: string;
  relationships: RelationshipData[];
  direction: 'INCOMING' | 'OUTGOING';
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  searchTerm?: string;
  searchIndex?: string;
  isSearching?: boolean;
  showSearch?: boolean;
}

export interface RelationshipData {
  node: any;
  relationship: any;
  nodeLabels: string[];
}

export interface RelationshipSearchEvent {
  group: RelationshipGroup;
  searchTerm: string;
}

export interface RelationshipPageEvent {
  group: RelationshipGroup;
  page: number;
}

export interface ExportConfig {
  query?: string;
  parameters?: any;
  searchIndex?: string;
  searchTerm?: string;
  whereClause?: string;
  returnClause?: string;
  orderClause?: string;
}
