import type { StoredSuggestion } from '@/types/llm';

const SUGGESTIONS_STORAGE_KEY = 'gs_ai_suggestions';
const DISMISSAL_EXPIRY_HOURS = 48;

class AISuggestionsService {
  private getSuggestions(): StoredSuggestion[] {
    const stored = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as StoredSuggestion[];
    } catch {
      return [];
    }
  }

  private saveSuggestions(suggestions: StoredSuggestion[]): void {
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(suggestions));
  }

  private generateId(): string {
    return `sug-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private isDismissalExpired(dismissedAt: string): boolean {
    const dismissedTime = new Date(dismissedAt).getTime();
    const expiryTime = dismissedTime + DISMISSAL_EXPIRY_HOURS * 60 * 60 * 1000;
    return Date.now() > expiryTime;
  }

  addSuggestion(
    suggestion: Omit<StoredSuggestion, 'id' | 'createdAt' | 'dismissedAt' | 'expiresAt'>
  ): StoredSuggestion {
    const suggestions = this.getSuggestions();

    const existing = suggestions.find(
      (s) =>
        s.type === suggestion.type &&
        s.entityType === suggestion.entityType &&
        s.entityId === suggestion.entityId &&
        s.title === suggestion.title
    );

    if (existing) {
      if (existing.dismissedAt && this.isDismissalExpired(existing.dismissedAt)) {
        existing.dismissedAt = null;
        existing.createdAt = new Date().toISOString();
        this.saveSuggestions(suggestions);
      }
      return existing;
    }

    const newSuggestion: StoredSuggestion = {
      ...suggestion,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      dismissedAt: null,
      expiresAt: null,
    };

    suggestions.push(newSuggestion);
    this.saveSuggestions(suggestions);
    return newSuggestion;
  }

  dismissSuggestion(id: string): void {
    const suggestions = this.getSuggestions();
    const suggestion = suggestions.find((s) => s.id === id);
    if (suggestion) {
      suggestion.dismissedAt = new Date().toISOString();
      this.saveSuggestions(suggestions);
    }
  }

  removeSuggestion(id: string): void {
    const suggestions = this.getSuggestions().filter((s) => s.id !== id);
    this.saveSuggestions(suggestions);
  }

  getActiveSuggestions(
    entityType?: 'task' | 'project' | null,
    entityId?: string
  ): StoredSuggestion[] {
    const suggestions = this.getSuggestions();

    return suggestions.filter((s) => {
      if (s.dismissedAt && !this.isDismissalExpired(s.dismissedAt)) {
        return false;
      }
      if (entityType !== undefined && s.entityType !== entityType) {
        return false;
      }
      return entityId === undefined || s.entityId === entityId;
    });
  }

  getGlobalSuggestions(): StoredSuggestion[] {
    return this.getActiveSuggestions(null);
  }

  getTaskSuggestions(taskId: string): StoredSuggestion[] {
    return this.getActiveSuggestions('task', taskId);
  }

  getProjectSuggestions(projectId: string): StoredSuggestion[] {
    return this.getActiveSuggestions('project', projectId);
  }

  getAllTaskSuggestions(): StoredSuggestion[] {
    return this.getActiveSuggestions('task');
  }

  getAllProjectSuggestions(): StoredSuggestion[] {
    return this.getActiveSuggestions('project');
  }

  clearExpiredDismissals(): void {
    const suggestions = this.getSuggestions();
    let changed = false;

    suggestions.forEach((s) => {
      if (s.dismissedAt && this.isDismissalExpired(s.dismissedAt)) {
        s.dismissedAt = null;
        changed = true;
      }
    });

    if (changed) {
      this.saveSuggestions(suggestions);
    }
  }

  clearAllSuggestions(): void {
    localStorage.removeItem(SUGGESTIONS_STORAGE_KEY);
  }

  getSuggestionCount(): { total: number; active: number; dismissed: number } {
    const suggestions = this.getSuggestions();
    const active = this.getActiveSuggestions().length;
    const dismissed = suggestions.filter(
      (s) => s.dismissedAt && !this.isDismissalExpired(s.dismissedAt)
    ).length;

    return {
      total: suggestions.length,
      active,
      dismissed,
    };
  }
}

export const aiSuggestionsService = new AISuggestionsService();
