export interface QueryOptions {
  labels?: string[];
  properties?: string[];
  filters?: QueryFilter[];
  limit?: number;
  skip?: number;
  orderBy?: { property: string; direction: 'ASC' | 'DESC' };
  relationships?: { type: string; direction: 'IN' | 'OUT' }[];
}

export interface QueryFilter {
  property: string;
  operator: '=' | 'CONTAINS' | 'STARTS WITH' | 'ENDS WITH' | '>' | '<' | '>=';
  value: any;
}

export interface SortOption {
  attribute: string;
  direction: 'ASC' | 'DESC';
}

export interface AdvancedQueryOptions {
  customWhereClause?: string;
  customParameters?: { [key: string]: any };
  relationships?: {
    type: string;
    direction?: 'IN' | 'OUT';
    targetLabel?: string;
    alias?: string;
  }[];
  customReturn?: string;
}

export interface RelationshipExportOptions {
  nodeId: string;
  nodeType: string;
  relationshipType: string;
  direction: 'INCOMING' | 'OUTGOING';
  searchTerm?: string;
  searchIndex?: string;
}

export interface GenericListQueryOptions {
  entityType: string;
  fixedFilters: QueryFilter[];
  activeFilters: { [key: string]: any };
  filterDefinitions: ListFilter[];
  customWhereClause?: string;
  customParameters?: { [key: string]: any };
  advancedQueryOptions?: AdvancedQueryOptions;
  sortBy?: SortOption;
  offset?: number;
  limit?: number;
  isCount?: boolean;
  forExport?: boolean;
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
