// This is the source of truth for data structures like Prompt and Folder
export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  is_system: number; // DB uses integer 0/1
  user_id?: number;
  children?: Folder[];
}

export interface Prompt {
  id: string;
  title: string;
  prompt: string;
  tags: string[];
  folder_id: string;
  is_favorite: boolean;
  user_id?: number;
  deleted_at?: string | null;
}