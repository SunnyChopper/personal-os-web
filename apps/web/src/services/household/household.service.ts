import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';

export interface HouseholdDashboard {
  pendingDropzoneCount: number;
  recentCaptures: Record<string, unknown>[];
  mealsWeekStart?: string | null;
  mealEntries: Record<string, unknown>[];
  petSupplies: Record<string, unknown>[];
  lowStockPets: Record<string, unknown>[];
  petEvents: Record<string, unknown>[];
  logisticsConfigured: boolean;
}

export const householdService = {
  async getDashboard(): Promise<ApiResponse<HouseholdDashboard>> {
    return apiClient.get<HouseholdDashboard>('/household/dashboard');
  },

  async listCaptures(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return apiClient.get<Record<string, unknown>[]>('/household/dropzone');
  },

  async submitDropzone(
    rawText: string,
    preset?: string
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.post<Record<string, unknown>>('/household/dropzone', { rawText, preset });
  },

  async getMealsWeek(weekStart: string): Promise<ApiResponse<Record<string, unknown>[]>> {
    return apiClient.get<Record<string, unknown>[]>(
      `/household/meals/week?weekStart=${encodeURIComponent(weekStart)}`
    );
  },

  async putMealsWeek(weekStart: string, entries: Record<string, unknown>[]) {
    return apiClient.put<Record<string, unknown>[]>('/household/meals/week', {
      weekStart,
      entries,
    });
  },

  async listPetSupplies(): Promise<ApiResponse<Record<string, unknown>[]>> {
    return apiClient.get<Record<string, unknown>[]>('/household/pets/supplies');
  },

  async upsertPetSupply(body: Record<string, unknown>) {
    return apiClient.post<Record<string, unknown>>('/household/pets/supplies', body);
  },

  async adjustPetSupply(supplyId: string, quantityDelta: number, eventType = 'adjust') {
    return apiClient.post<Record<string, unknown>>(`/household/pets/supplies/${supplyId}/adjust`, {
      quantityDelta,
      eventType,
    });
  },
};
