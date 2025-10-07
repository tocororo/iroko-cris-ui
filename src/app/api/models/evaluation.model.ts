export interface EvaluationMethodology {
  id: string;
  name: string;
  version: string;
  description: string;
  entity: string;
  sections: EvaluationSection[];
}

export interface EvaluationSection {
  id: string;
  title: string;
  description: string;
  categories: EvaluationCategory[];
  result?: number;
  recommendation?: string;
}

export interface EvaluationCategory {
  id: string;
  title: string;
  questions: EvaluationQuestion[];
  result?: number;
  recommendation?: string;
}

export interface EvaluationQuestion {
  id: string;
  type: 'boolean' | 'number' | 'select';
  description: string;
  min?: number;
  max?: number;
  selectOptions?: SelectOption[];
  result?: any;
  recommendation?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface EvaluationResult {
  methodology_id: string;
  node_id: string;
  user_id?: string;
  timestamp?: string;
  evaluation: EvaluationMethodology;
}

export interface EvaluationRequest {
  node_id: string;
  methodology_id: string;
  evaluation: EvaluationMethodology;
}

export interface EvaluationHistoryItem {
  id: string;
  methodology_id: string;
  methodology_name: string;
  node_id: string;
  node_name: string;
  user_name: string;
  timestamp: string;
  overall_score?: number;
}
