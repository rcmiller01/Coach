// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Minimal', () => {
    it('renders', () => {
        render(<div>Hello</div>);
        expect(screen.getByText('Hello')).toBeDefined();
    });
});
