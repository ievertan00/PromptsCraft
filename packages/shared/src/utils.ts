
import { ApiError } from "@google/genai";

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;

// This function will be used to retry any function that might fail with a 503 error.
export const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
): Promise<T> => {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (error) {
            if (
                error instanceof ApiError &&
                (error.message.includes('503') || error.message.includes('429'))
            ) {
                if (attempt >= MAX_RETRIES) {
                    throw new Error(`API call failed after ${MAX_RETRIES} retries: ${error.message}`);
                }
                const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
                if (onRetry) {
                    onRetry(attempt + 1, delay);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            } else {
                throw error;
            }
        }
    }
};
