export interface CypherQuery {
  query: string;
  parameters?: { [key: string]: any } | null;
  readonly?: boolean;
}

export interface FullTextCypherQuery {
  searchIndex: string;
  searchTerm: string;
  whereClause?: string;
  orderClause?: string;
  returnClause?: string;
  parameters?: { [key: string]: any } | null;
  countTotal?: boolean;
}
