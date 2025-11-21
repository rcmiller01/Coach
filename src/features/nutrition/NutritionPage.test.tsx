// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NutritionPage from './NutritionPage';

// Mock API client
vi.mock('../../api/nutritionApiClient', () => ({
    fetchWeeklyPlan: vi.fn(),
    generateMealPlanForWeek: vi.fn(),
    getNutritionPlan: vi.fn(),
}));

describe('NutritionPage', () => {
    const mockTargets = {
        caloriesPerDay: 2000,
        proteinGrams: 150,
        carbsGrams: 200,
        fatGrams: 65,
    };

    it('renders preference inputs', () => {
        render(<NutritionPage targets={mockTargets} />);

        expect(screen.getByText(/Diet Type/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/e.g., dairy, nuts, shellfish/i)).toBeDefined();
    });

    it('updates preferences state when inputs change', () => {
        render(<NutritionPage targets={mockTargets} />);

        const dietSelect = screen.getByRole('combobox', { name: /Diet Type/i });
        fireEvent.change(dietSelect, { target: { value: 'vegetarian' } });
        expect((dietSelect as HTMLSelectElement).value).toBe('vegetarian');

        const avoidInput = screen.getByPlaceholderText(/e.g., dairy, nuts, shellfish/i);
        fireEvent.change(avoidInput, { target: { value: 'gluten' } });
        expect((avoidInput as HTMLInputElement).value).toBe('gluten');
    });

    it('shows generate button', () => {
        render(<NutritionPage targets={mockTargets} />);
        const generateBtn = screen.getByText(/Generate Week/i);
        expect(generateBtn).toBeDefined();
    });
});
