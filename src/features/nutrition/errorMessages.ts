import type { ErrorCode } from './nutritionTypes';

export const FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
    AI_TIMEOUT: 'The AI chef is taking a bit longer than expected. Please try again.',
    AI_QUOTA_EXCEEDED: 'You’ve reached your daily AI limit. Try again tomorrow!',
    AI_PARSE_FAILED: 'We couldn’t quite understand that food. Try a simpler description.',
    AI_PLAN_FAILED: 'We had trouble generating your plan. Please give it another shot.',
    AI_PLAN_INFEASIBLE: 'Those targets look a bit tricky. Try adjusting your goals slightly.',
    AI_RATE_LIMITED: 'Whoa, slow down! The AI needs a moment to catch up.',
    AI_DISABLED_FOR_USER: 'AI features are currently disabled for your account.',
    NETWORK_ERROR: 'Connection lost. Please check your internet.',
    VALIDATION_ERROR: 'Something looks off with the request. Please refresh and try again.',
    NOT_FOUND: 'We couldn’t find what you were looking for.',
    UNKNOWN_ERROR: 'Something went wrong. Please try again later.',
    MEAL_REGENERATE_EMPTY: 'The AI couldn’t come up with a meal. Please try again.',
};

export function getFriendlyMessage(code: ErrorCode): string {
    return FRIENDLY_MESSAGES[code] || FRIENDLY_MESSAGES.UNKNOWN_ERROR;
}
