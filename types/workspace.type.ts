export interface WorkspaceAIPersona {
  tone: string;
  industry: string;
  target_audience: string;
}

export interface WorkspaceItem {
  id: string;
  user_id?: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  is_default: boolean;
  channel_count?: number;
  ai_persona?: WorkspaceAIPersona;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceChannelMapping {
  id: string;
  workspace_id: string;
  user_channel_id: string;
  created_at?: string;
}
