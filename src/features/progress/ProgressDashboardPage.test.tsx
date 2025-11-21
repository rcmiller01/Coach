import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProgressDashboardPage from './ProgressDashboardPage';
import * as progressApi from '../../api/progressApiClient';

// Mock the progress API client
vi.mock('../../api/progressApiClient', () => ({
    fetchWeekSummary: vi.fn(),
    fetchTrends: vi.fn(),
}));

describe('ProgressDashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        vi.mocked(progressApi.fetchWeekSummary).mockImplementation(() => new Promise(() => { }));
        vi.mocked(progressApi.fetchTrends).mockImplementation(() => new Promise(() => { }));

        render(<ProgressDashboardPage />);

        expect(screen.getByText(/loading progress/i)).toBeDefined();
    });

    it('shows empty state when no data', async () => {
        vi.mocked(progressApi.fetchWeekSummary).mockResolvedValue({
            weekStart: '2025-01-01',
            weekEnd: '2025-01-07',
            workoutsCompleted: 0,
            nutritionDaysLogged: 0,
            avgCalories: 0,
            avgProtein: 0,
        });

        vi.mocked(progressApi.fetchTrends).mockResolvedValue({
            weights: [],
            trend: 'stable',
        });

        render(<ProgressDashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/no progress data yet/i)).toBeDefined();
        });
    });

    it('displays week summary correctly', async () => {
        vi.mocked(progressApi.fetchWeekSummary).mockResolvedValue({
            weekStart: '2025-01-01',
            weekEnd: '2025-01-07',
            workoutsCompleted: 3,
            nutritionDaysLogged: 5,
            avgCalories: 2000,
            avgProtein: 150,
        });

        vi.mocked(progressApi.fetchTrends).mockResolvedValue({
            weights: [],
            trend: 'stable',
        });

        render(<ProgressDashboardPage />);

        await waitFor(() => {
            expect(screen.getByText('3')).toBeDefined(); // workouts
            expect(screen.getByText('5')).toBeDefined(); // nutrition days
            expect(screen.getByText('2000')).toBeDefined(); // calories
            expect(screen.getByText('150')).toBeDefined(); // protein
        });
    });

    it('displays weight trend chart with data', async () => {
        vi.mocked(progressApi.fetchWeekSummary).mockResolvedValue({
            weekStart: '2025-01-01',
            weekEnd: '2025-01-07',
            workoutsCompleted: 2,
            nutritionDaysLogged: 3,
            avgCalories: 1800,
            avgProtein: 120,
        });

        vi.mocked(progressApi.fetchTrends).mockResolvedValue({
            weights: [
                { date: '2025-01-01', weight: 180 },
                { date: '2025-01-08', weight: 178 },
                { date: '2025-01-15', weight: 176 },
            ],
            trend: 'decreasing',
        });

        render(<ProgressDashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/weight trend/i)).toBeDefined();
            expect(screen.getByText('180 lbs')).toBeDefined();
            expect(screen.getByText('178 lbs')).toBeDefined();
            expect(screen.getByText('176 lbs')).toBeDefined();
            expect(screen.getByText(/decreasing/i)).toBeDefined();
        });
    });

    it('shows error state when API fails', async () => {
        vi.mocked(progressApi.fetchWeekSummary).mockRejectedValue(new Error('API Error'));
        vi.mocked(progressApi.fetchTrends).mockRejectedValue(new Error('API Error'));

        render(<ProgressDashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeDefined();
        });
    });
});
