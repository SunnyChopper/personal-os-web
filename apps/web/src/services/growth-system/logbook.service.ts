import { apiClient } from '@/lib/api-client';
import type {
  LogbookEntry,
  CreateLogbookEntryInput,
  UpdateLogbookEntryInput,
  LogbookMood,
} from '@/types/growth-system';
import type { ApiResponse, ApiListResponse } from '@/types/api-contracts';

interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Backend returns energyLevel, but frontend expects energy
interface BackendLogbookEntry {
  id: string;
  date: string;
  title: string | null;
  notes: string | null;
  mood: LogbookMood | null;
  energyLevel?: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Helper to extract YYYY-MM-DD from date string, preventing timezone conversion issues
function normalizeDate(dateString: string): string {
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // If it's an ISO string, extract just the date part before 'T'
  if (dateString.includes('T')) {
    const datePart = dateString.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
  }
  // Try to extract YYYY-MM-DD from the beginning of the string
  const dateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch && dateMatch[1]) {
    return dateMatch[1];
  }
  // If we can't extract it, return as-is (shouldn't happen in normal cases)
  return dateString;
}

// Normalize backend response to frontend format
function normalizeLogbookEntry(entry: BackendLogbookEntry): LogbookEntry {
  const { energyLevel, ...rest } = entry;
  return {
    ...rest,
    date: normalizeDate(entry.date), // Normalize date to YYYY-MM-DD format
    energy: energyLevel ?? null,
  };
}

export const logbookService = {
  async getAll(filters?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiListResponse<LogbookEntry>> {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.pageSize) queryParams.append('pageSize', String(filters.pageSize));

    const endpoint = `/logbook${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BackendPaginatedResponse<BackendLogbookEntry>>(endpoint);

    if (response.success && response.data) {
      return {
        data: response.data.data.map(normalizeLogbookEntry),
        total: response.data.total,
        success: true,
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch logbook entries');
  },

  async getById(id: string): Promise<ApiResponse<LogbookEntry>> {
    const response = await apiClient.get<BackendLogbookEntry>(`/logbook/${id}`);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeLogbookEntry(response.data),
      };
    }
    return {
      success: false,
      error: response.error,
      data: undefined,
    };
  },

  async getByDate(date: string): Promise<ApiResponse<LogbookEntry>> {
    const response = await apiClient.get<BackendLogbookEntry>(`/logbook/${date}`);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeLogbookEntry(response.data),
      };
    }
    return {
      success: false,
      error: response.error,
      data: undefined,
    };
  },

  async create(input: CreateLogbookEntryInput): Promise<ApiResponse<LogbookEntry>> {
    // Transform energy to energyLevel for the API request to match backend format
    const requestBody: {
      date: string;
      title?: string;
      notes?: string;
      mood?: LogbookMood;
      energyLevel?: number;
    } = {
      date: input.date,
    };
    if (input.title !== undefined) requestBody.title = input.title;
    if (input.notes !== undefined) requestBody.notes = input.notes;
    if (input.mood !== undefined) requestBody.mood = input.mood;
    if (input.energy !== undefined) requestBody.energyLevel = input.energy;
    const response = await apiClient.post<BackendLogbookEntry>('/logbook', requestBody);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeLogbookEntry(response.data),
      };
    }
    return {
      success: false,
      error: response.error,
      data: undefined,
    };
  },

  async update(id: string, input: UpdateLogbookEntryInput): Promise<ApiResponse<LogbookEntry>> {
    // Transform energy to energyLevel for the API request
    // Include date if provided to fix timezone-shifted dates
    const requestBody: Record<string, unknown> = {};
    if (input.date !== undefined) requestBody.date = input.date;
    if (input.title !== undefined) requestBody.title = input.title;
    if (input.notes !== undefined) requestBody.notes = input.notes;
    if (input.mood !== undefined) requestBody.mood = input.mood;
    if (input.energy !== undefined) requestBody.energyLevel = input.energy;
    const response = await apiClient.patch<BackendLogbookEntry>(`/logbook/${id}`, requestBody);
    if (response.success && response.data) {
      return {
        success: true,
        data: normalizeLogbookEntry(response.data),
        error: undefined,
      };
    }
    return {
      success: false,
      error: response.error,
      data: undefined,
    } as ApiResponse<LogbookEntry>;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/logbook/${id}`);
    return response;
  },

  async getLinks(
    entryId: string
  ): Promise<ApiListResponse<{ entityType: string; entityId: string }>> {
    const response = await apiClient.get<
      BackendPaginatedResponse<{ entityType: string; entityId: string }>
    >(`/logbook/${entryId}/links`);
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch logbook links');
  },

  async linkTask(entryId: string, taskId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/logbook/${entryId}/links`, {
      entityType: 'task',
      entityId: taskId,
    });
    return response;
  },

  async unlinkTask(entryId: string, taskId: string): Promise<ApiResponse<void>> {
    // Backend may require linkId, but we'll use taskId as identifier
    const linksResponse = await this.getLinks(entryId);
    if (linksResponse.success && linksResponse.data) {
      const link = linksResponse.data.find((l) => l.entityType === 'task' && l.entityId === taskId);
      if (link) {
        const response = await apiClient.delete<void>(`/logbook/${entryId}/links/${link.entityId}`);
        return response;
      }
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Link not found' },
    };
  },

  async linkHabit(entryId: string, habitId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/logbook/${entryId}/links`, {
      entityType: 'habit',
      entityId: habitId,
    });
    return response;
  },

  async unlinkHabit(entryId: string, habitId: string): Promise<ApiResponse<void>> {
    const linksResponse = await this.getLinks(entryId);
    if (linksResponse.success && linksResponse.data) {
      const link = linksResponse.data.find(
        (l) => l.entityType === 'habit' && l.entityId === habitId
      );
      if (link) {
        const response = await apiClient.delete<void>(`/logbook/${entryId}/links/${link.entityId}`);
        return response;
      }
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Link not found' },
    };
  },
};
