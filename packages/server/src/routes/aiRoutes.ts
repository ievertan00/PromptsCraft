import express from 'express';
import { suggestTags, refinePrompt, suggestTitle } from '../services/serverAiService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/suggest-tags', authenticateToken, async (req, res) => {
    try {
        const { promptContent, selectedModel } = req.body;
        const tags = await suggestTags(promptContent, selectedModel);
        res.json({ suggestedTags: tags });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get AI tag suggestions.', details: (error as Error).message });
    }
});

router.post('/refine-prompt', authenticateToken, async (req, res) => {
    try {
        const { promptContent, selectedModel, persona, task, context, format, max_tokens } = req.body;
        const refined = await refinePrompt(promptContent, selectedModel, { persona, task, context, format, max_tokens });
        res.json({ refinedPrompt: refined });
    } catch (error) {
        res.status(500).json({ error: 'Failed to refine prompt.', details: (error as Error).message });
    }
});

router.post('/suggest-title', authenticateToken, async (req, res) => {
    try {
        const { promptContent, selectedModel } = req.body;
        const title = await suggestTitle(promptContent, selectedModel);
        res.json({ suggestedTitle: title });
    } catch (error) {
        res.status(500).json({ error: 'Failed to suggest title.', details: (error as Error).message });
    }
});

export default router;
