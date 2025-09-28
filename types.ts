
export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    children?: Folder[];
}

export interface Prompt {
    id: string;
    folderId: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
}
