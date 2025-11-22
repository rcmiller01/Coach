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
            userId: 'test-user',
            weekStart: '2025-01-01',
            weekEnd: '2025-01-07',
            workouts: {
                sessionsCompleted: 0,
            },
            nutrition: {
                daysLogged: 0,
                avgCaloriesActual: 0,
                avgProteinActual: 0,
            },
            weight: {
                hasEnoughData: false,
                trend: 'unknown',
            },
            insights: [],
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
            userId: 'test-user',
            weekStart: '2025-01-01',
            weekEnd: '2025-01-07',
            workouts: {
                sessionsCompleted: 3,
            },
            nutrition: {
                daysLogged: 5,
                avgCaloriesActual: 2000,
                avgProteinActual: 150,
            },
            weight: {
                hasEnoughData: true,
                latest: 180,
                changePerWeek: -0.5,
                trend: 'decreasing',
            },
            insights: ['Good progress this week!'],
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
            userId: 'test-user',
            weekStart: '2025-01-01',
            weekEnd: '2025-01-07',
            workouts: {
                sessionsCompleted: 2,
            },
            nutrition: {
                daysLogged: 3,
                avgCaloriesActual: 1800,
                avgProteinActual: 120,
            },
            weight: {
                hasEnoughData: true,
                latest: 178,
                changePerWeek: -1.0,
                trend: 'decreasing',
            },
            insights: ['Weight trending down'],
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
