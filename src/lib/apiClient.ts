/**
 * Shared API Client
 * 
 * Centralizes API configuration, authentication, and error handling.
 */

// API Base URL from environment or default
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/**
 * Custom API Error class to preserve status codes and messages
 */
export class ApiError extends Error {
    status: number;
    code?: string;
    retryable?: boolean;

    constructor(message: string, status: number, code?: string, retryable?: boolean) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.retryable = retryable;
    }
}

/**
 * Common headers for all requests
 */
function getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
    const userId = localStorage.getItem('coach_user_id') || '';

    return {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        ...customHeaders,
    };
}

/**
 * Generic fetch wrapper
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Ensure endpoint starts with / if not empty
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${path}`;

    const config: RequestInit = {
        ...options,
        headers: getHeaders(options.headers as Record<string, string>),
    };

    try {
        const response = await fetch(url, config);

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        const text = await response.text();

        // Try to parse JSON if content exists
        let data: any;
        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { message: text };
            }
        }

        if (!response.ok) {
            // Extract error details from standardized backend error format if available
            // Expected format: { error: { message, code, retryable } } or { message }
            const errorMessage = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
            const errorCode = data?.error?.code;
            const retryable = data?.error?.retryable;

            throw new ApiError(errorMessage, response.status, errorCode, retryable);
        }

        // Unwrap 'data' property if it exists (common API pattern), otherwise return whole response
        return (data && data.data) ? data.data : data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        // Network errors or other unexpected issues
        throw new ApiError(error instanceof Error ? error.message : 'Network error', 0, 'NETWORK_ERROR', true);
    }
}

// API Client Interface
export const apiClient = {
    get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
    post: <T>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
