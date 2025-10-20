
export interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    children?: Folder[];
    sort_order: number;
}

export interface Prompt {
    id: string;
    folder_id: string;
    title: string;
    prompt: string;
    tags: string[] | string; // Allow string for JSON parsing
    createdAt: string;
    isFavorite?: boolean;
    persona?: boolean;
    task?: boolean;
    context?: boolean;
    format?: boolean;
    max_tokens?: number;
}

