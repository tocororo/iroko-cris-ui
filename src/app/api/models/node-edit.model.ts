// src/app/api/models/node-edit.model.ts
export interface NodePropertyUpdate {
  iroko_uuid: string;
  properties: { [key: string]: any };
}

export interface RelationshipUpdate {
  from_uuid: string;
  to_uuid: string;
  relation_type: string;
  properties?: { [key: string]: any } | null;
}

export interface RelationshipDeleteRequest {
  from_uuid: string;
  to_uuid: string;
  relation_type: string;
}

export interface NodeEditRequest {
  iroko_uuid: string;
  properties: { [key: string]: any };
  relationships: RelationshipUpdate[];
}

export interface EditResponse {
  success: boolean;
  message: string;
  updated_properties?: number | null;
  updated_relationships?: number | null;
  deleted_relationships?: number | null;
}

export interface ExistingRelationship {
  relationship: any;
  relatedNode: any;
  direction: 'INCOMING' | 'OUTGOING';
  type: string;
}
