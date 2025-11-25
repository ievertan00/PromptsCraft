// This is the source of truth for data structures like Prompt and Folder
export interface Folder {
  id: string;
  name: string;
  // Add other properties as needed based on the application's data structure
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  // Add other properties as needed
}