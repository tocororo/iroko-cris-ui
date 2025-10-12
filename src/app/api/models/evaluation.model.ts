export interface Answer {
  result?: any;
  recommendation?: string;
  user_id?: string;
}

export interface EvaluationMethodology {
  id: string;
  name: string;
  version: string;
  description: string;
  entity: string;
  sections: EvaluationSection[];
  answer?: Answer;
}

export interface EvaluationSection {
  id: string;
  title: string;
  description?: string;
  categories: EvaluationCategory[];
  answer?: Answer;
}

export interface EvaluationCategory {
  id: string;
  title: string;
  description?: string;
  questions: string[]; // Changed from EvaluationQuestion[] to string[] (question IDs)
  answer?: Answer;
}

export interface EvaluationQuestion {
  id: string;
  type: 'boolean' | 'number' | 'select';
  desc: string;
  min?: number;
  max?: number;
  selectOptions?: SelectOption[];
  answer?: Answer;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface EvaluationResult {
  methodology: EvaluationMethodology;
  node_id: string;
  user_id?: string;
  timestamp?: string;
  is_complete: boolean;
  is_finalized: boolean;
  // New field to store question data separately
  question_data: { [questionId: string]: EvaluationQuestion };
}

export interface EvaluationRequest {
  node_id: string;
  methodology_id: string;
  evaluation: EvaluationResult;
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

// New interface for stored evaluations from backend
export interface StoredEvaluation {
  id: string;
  node_id: string;
  user_id: string;
  methodology_id: string;
  timestamp: string;
  evaluation_data: any; // JSON representation of EvaluationResult
  is_complete: boolean;
}

// New interface for methodology listing
export interface Methodology {
  id: string;
  name: string;
  version: string;
  description: string;
  entity: string;
  sections: EvaluationSection[];
}
