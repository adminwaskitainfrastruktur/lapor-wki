export type StepType = 'text' | 'email' | 'tel' | 'date' | 'longtext';

export interface Step {
  key: string;
  type: StepType;
  label: string;
  q: string;
  section?: string;
}

export interface Flow {
  prefix: string;
  title: string;
  button: string;
  blurb: string;
  intro: string[];
  steps: Step[];
  files_prompt: string;
  outro: string;
}

export interface UploadRules {
  maxFiles: number;
  maxSizeMb: number;
  extensions: string[];
}

export interface FlowsResponse {
  flows: Record<string, Flow>;
  upload: UploadRules;
}

export type Answers = Record<string, string>;

export interface ChatMessage {
  id: number;
  role: 'bot' | 'user';
  text: string;
  kind?: 'section' | 'summary' | 'done' | 'error';
}

export type Phase = 'loading' | 'choose' | 'asking' | 'files' | 'review' | 'sending' | 'done';
