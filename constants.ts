
import type { Folder, Prompt } from './types';

export const TAG_COLORS: string[] = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
];

export const TAILWIND_TAG_COLORS = [
    'blue', 'green', 'yellow', 'indigo', 'purple', 'pink', 'red', 'orange', 'gray', 'teal', 'cyan', 'lime'
];

export const initialFolders: Folder[] = [
    { id: '1', name: 'Development', parentId: null },
    { id: '2', name: 'React Tools', parentId: '1' },
    { id: '3', name: 'Node.js', parentId: '1' },
    { id: '4', name: 'Marketing', parentId: null },
    { id: '5', name: 'Content Creation', parentId: '4' },
    { id: '6', name: 'Social Media', parentId: '4' },
];

export const initialPrompts: Prompt[] = [
    {
        id: 'p1',
        folderId: '2',
        title: 'React Component Lifecycle Hook Explanation',
        content: 'Explain the React component lifecycle for a functional component using hooks like useEffect.',
        tags: ['React', 'Hooks', 'Lifecycle', 'useEffect'],
        createdAt: '2023-10-26T10:00:00Z',
        isFavorite: true,
    },
    {
        id: 'p2',
        folderId: '2',
        title: 'Custom Hook for Fetching Data',
        content: 'Write a custom React hook `useFetch` that handles data fetching, loading states, and error handling.',
        tags: ['React', 'Hooks', 'Custom Hook', 'API'],
        createdAt: '2023-10-25T14:30:00Z',
        isFavorite: true,
    },
    {
        id: 'p3',
        folderId: '3',
        title: 'Express Middleware Logger',
        content: 'Create a simple logger middleware for an Express.js application that logs the request method and URL.',
        tags: ['Node.js', 'Express', 'Middleware'],
        createdAt: '2023-10-24T11:00:00Z',
    },
    {
        id: 'p4',
        folderId: '5',
        title: 'Blog Post Idea Generator',
        content: 'Generate 5 blog post ideas for a blog about sustainable living. The ideas should be engaging and SEO-friendly.',
        tags: ['Content', 'Blog', 'SEO'],
        createdAt: '2023-10-23T09:00:00Z',
    },
    {
        id: 'p5',
        folderId: '6',
        title: 'Twitter Thread about AI',
        content: 'Write a 5-tweet thread about the future of generative AI in content creation. Make it engaging and easy to understand for a non-technical audience.',
        tags: ['Social Media', 'Twitter', 'AI'],
        createdAt: '2023-10-22T16:00:00Z',
    },
];
