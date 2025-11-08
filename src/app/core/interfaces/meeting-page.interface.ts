export interface MeetingPage {
  id: string;
  user: string;
  title: string;
  description?:string;
  slug: string;
  theme: ThemeConfig;
  fields: FieldConfig[];
  layout_style: 'classic' | 'minimal' | 'modern';
  logo?: string;
  banner_image?: string;
  background_image?: string;
  active: boolean;
  event_type: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  buttonStyle?: string;
  fontFamily?: string;
}

export interface FieldConfig {
  id: string;
  type: 'text' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'date' | 'textarea';
  label: string;
  name: string;
  required: boolean;
  options?: string[]; // For dropdown
  placeholder?: string;
  validation?: any;
  order: number;
}

