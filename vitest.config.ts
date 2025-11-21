/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environmentMatchGlobs: [
            ['src/**', 'jsdom'],
            ['backend/**', 'node'],
        ],
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
