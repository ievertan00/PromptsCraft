
export interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    children?: Folder[];
}

export interface Prompt {
    id: string;
    folder_id: string;
    title: string;
    content: string;
    tags: string[] | string; // Allow string for JSON parsing
    createdAt: string;
}

