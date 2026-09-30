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

export interface AuthConfig {
  clientId: string;
  authority: string;
}

export interface FlowsResponse {
  flows: Record<string, Flow>;
  upload: UploadRules;
  auth: AuthConfig;
}

export interface TrackedReport {
  ref: string;
  type: string;
  typeTitle: string;
  status: string;
  publicNote: string;
  createdAt: string;
  updatedAt: string | null;
}

export type Answers = Record<string, string>;

export interface ChatMessage {
  id: number;
  role: 'bot' | 'user';
  text: string;
  /** 'q' = pertanyaan aktif dari bot (dipakai tema B untuk teks besar) */
  kind?: 'section' | 'summary' | 'done' | 'error' | 'q';
}

export type Phase = 'loading' | 'choose' | 'asking' | 'files' | 'review' | 'sending' | 'done';
