export interface CypherQuery {
  query: string;
  parameters?: { [key: string]: any } | null;
  readonly?: boolean;
}
