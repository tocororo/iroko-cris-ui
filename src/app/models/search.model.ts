export interface SearchResult {
  iroko_uuid: string;
  type: string;
  name: string;
  description?: string;
  properties: any;
  score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets?: any;
}
