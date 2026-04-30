import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  vaultItemsService,
  coursesService,
  backendCourseToCourse,
} from '@/services/knowledge-vault';
import { shouldLoadKnowledgeVaultData } from '@/lib/route-data-policy';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  KnowledgeVaultContext,
  type KnowledgeVaultContextType,
  type VaultItem,
  type Course,
  type Note,
  type Document,
  type Flashcard,
  type FlashcardDeck,
  type VaultItemType,
  type VaultItemFilters,
  type CreateNoteInput,
  type UpdateNoteInput,
  type CreateDocumentInput,
  type UpdateDocumentInput,
  type CreateFlashcardInput,
  type CreateFlashcardDeckInput,
  type UpdateFlashcardInput,
  type CreateCourseInput,
  type UpdateCourseInput,
} from './types';

interface KnowledgeVaultProviderProps {
  children: ReactNode;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const KnowledgeVaultProvider = ({ children }: KnowledgeVaultProviderProps) => {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const kvEnabled = shouldLoadKnowledgeVaultData(pathname);
  const [actionError, setActionError] = useState<string | null>(null);

  const vaultQuery = useQuery({
    queryKey: queryKeys.knowledgeVault.vaultItems(),
    enabled: kvEnabled,
    queryFn: async (): Promise<VaultItem[]> => {
      const response = await vaultItemsService.getAll();
      if (response.success && response.data) {
        return response.data;
      }
      const msg = response.error || '';
      if (msg.includes('404') || msg.includes('Not Found')) {
        return [];
      }
      throw new Error(typeof msg === 'string' ? msg : 'Failed to load vault items');
    },
    staleTime: 5 * 60 * 1000,
  });

  const coursesQuery = useQuery({
    queryKey: queryKeys.knowledgeVault.courses(),
    enabled: kvEnabled,
    queryFn: async (): Promise<Course[]> => {
      const response = await coursesService.getAll();
      if (response.success && response.data) {
        return response.data;
      }
      const msg = response.error || '';
      if (msg.includes('404') || msg.includes('Not Found')) {
        return [];
      }
      throw new Error(typeof msg === 'string' ? msg : 'Failed to load courses');
    },
    staleTime: 5 * 60 * 1000,
  });

  const flashcardDecksQuery = useQuery({
    queryKey: queryKeys.knowledgeVault.flashcardDecks(),
    enabled: kvEnabled,
    queryFn: async (): Promise<FlashcardDeck[]> => {
      const response = await vaultItemsService.getFlashcardDecks();
      if (response.success && response.data) {
        return response.data;
      }
      const msg = response.error || '';
      if (typeof msg === 'string' && (msg.includes('404') || msg.includes('Not Found'))) {
        return [];
      }
      throw new Error(typeof msg === 'string' ? msg : 'Failed to load flashcard decks');
    },
    staleTime: 5 * 60 * 1000,
  });

  const vaultItems = vaultQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const flashcardDecks = flashcardDecksQuery.data ?? [];

  const loading =
    kvEnabled && (vaultQuery.isPending || coursesQuery.isPending || flashcardDecksQuery.isPending);

  const error = useMemo(() => {
    if (!kvEnabled) return actionError;
    const qErr =
      (vaultQuery.isError && vaultQuery.error ? errMsg(vaultQuery.error) : null) ||
      (coursesQuery.isError && coursesQuery.error ? errMsg(coursesQuery.error) : null) ||
      (flashcardDecksQuery.isError && flashcardDecksQuery.error
        ? errMsg(flashcardDecksQuery.error)
        : null);
    return qErr || actionError;
  }, [
    kvEnabled,
    actionError,
    vaultQuery.isError,
    vaultQuery.error,
    coursesQuery.isError,
    coursesQuery.error,
    flashcardDecksQuery.isError,
    flashcardDecksQuery.error,
  ]);

  const invalidateKv = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeVault.all });
  }, [queryClient]);

  const refreshVaultItems = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeVault.vaultItems() });
  }, [queryClient]);

  const refreshCourses = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeVault.courses() });
  }, [queryClient]);

  const refreshFlashcardDecks = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.knowledgeVault.flashcardDecks() });
  }, [queryClient]);

  const searchItems = useCallback(async (query: string): Promise<VaultItem[]> => {
    try {
      setActionError(null);
      const response = await vaultItemsService.search(query);

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setActionError(errorMessage);
      return [];
    }
  }, []);

  const getItemsByType = useCallback(
    (type: VaultItemType): VaultItem[] => {
      return vaultItems.filter((item) => item.type === type);
    },
    [vaultItems]
  );

  const filterItems = useCallback(async (filters: VaultItemFilters): Promise<VaultItem[]> => {
    try {
      setActionError(null);
      const response = await vaultItemsService.getAll(filters);

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Filter failed';
      setActionError(errorMessage);
      return [];
    }
  }, []);

  const createNote = useCallback(
    async (input: CreateNoteInput): Promise<Note> => {
      try {
        setActionError(null);
        const response = await vaultItemsService.createNote(input);

        if (response.success && response.data) {
          await invalidateKv();
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to create note');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
        setActionError(errorMessage);
        throw err;
      }
    },
    [invalidateKv]
  );

  const updateNote = useCallback(
    async (id: string, input: UpdateNoteInput): Promise<Note> => {
      try {
        setActionError(null);
        const response = await vaultItemsService.updateNote(id, input);

        if (response.success && response.data) {
          await invalidateKv();
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to update note');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
        setActionError(errorMessage);
        throw err;
      }
    },
    [invalidateKv]
  );

  const createDocument = useCallback(
    async (input: CreateDocumentInput): Promise<Document> => {
      try {
        setActionError(null);
        const response = await vaultItemsService.createDocument(input);

        if (response.success && response.data) {
          await invalidateKv();
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to create document');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create document';
        setActionError(errorMessage);
        throw err;
      }
    },
    [invalidateKv]
  );

  const updateDocument = useCallback(
    async (id: string, input: UpdateDocumentInput): Promise<Document> => {
      try {
        setActionError(null);
        const response = await vaultItemsService.updateDocument(id, input);

        if (response.success && response.data) {
          await invalidateKv();
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to update document');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update document';
        setActionError(errorMessage);
        throw err;
      }
    },
    [invalidateKv]
  );

  const createFlashcard = useCallback(
    async (input: CreateFlashcardInput): Promise<Flashcard> => {
      try {
        setActionError(null);
        const response = await vaultItemsService.createFlashcard(input);

        if (response.success && response.data) {
          await invalidateKv();
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to create flashcard');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create flashcard';
        setActionError(errorMessage);
        throw err;
      }
    },
    [invalidateKv]
  );

  const createFlashcardDeck = useCallback(
    async (input: CreateFlashcardDeckInput): Promise<FlashcardDeck> => {
      try {
        setActionError(null);
        const response = await vaultItemsService.createFlashcardDeck(input);

        if (response.success && response.data) {
          await invalidateKv();
          return response.data;
        } else {
          const err = response.error;
          const msg =
            typeof err === 'string'
              ? err
              : err != null &&
                  typeof err === 'object' &&
                  'message' in err &&
                  typeof (err as { message?: unknown }).message === 'string'
                ? (err as { message: string }).message
                : undefined;
          throw new Error(msg || 'Failed to create flashcard deck');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create flashcard deck';
        setActionError(errorMessage);
        throw err;
      }
    },
    [invalidateKv]
  );

  const updateFlashcard = useCallback(
    async (id: string, input: UpdateFlashcardInput): Promise<Flashcard> => {
      try {
        setActionError(null);
        const response = await vaultItemsService.updateFlashcard(id, input);

        if (response.success && response.data) {
          await invalidateKv();
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to update flashcard');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update flashcard';
        setActionError(errorMessage);
        throw err;
      }
    },
    [invalidateKv]
  );

  const createCourse = useCallback(
    async (input: CreateCourseInput): Promise<Course> => {
      try {
        setActionError(null);
        const response = await coursesService.create(input);

        if (response.success && response.data) {
          await refreshCourses();
          return backendCourseToCourse(response.data);
        } else {
          throw new Error(response.error || 'Failed to create course');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create course';
        setActionError(errorMessage);
        throw err;
      }
    },
    [refreshCourses]
  );

  const updateCourse = useCallback(
    async (id: string, input: UpdateCourseInput): Promise<Course> => {
      try {
        setActionError(null);
        const response = await coursesService.update(id, input);

        if (response.success && response.data) {
          await refreshCourses();
          return backendCourseToCourse(response.data);
        } else {
          throw new Error(response.error || 'Failed to update course');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update course';
        setActionError(errorMessage);
        throw err;
      }
    },
    [refreshCourses]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        setActionError(null);
        const response = await vaultItemsService.delete(id);

        if (!response.success) {
          throw new Error(response.error || 'Failed to delete item');
        }

        await invalidateKv();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
        setActionError(errorMessage);
        throw err;
      }
    },
    [invalidateKv]
  );

  const deleteCourse = useCallback(
    async (id: string): Promise<void> => {
      try {
        setActionError(null);
        const response = await coursesService.delete(id);

        if (!response.success) {
          throw new Error(response.error || 'Failed to delete course');
        }

        await refreshCourses();
        await invalidateKv();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete course';
        setActionError(errorMessage);
        throw err;
      }
    },
    [refreshCourses, invalidateKv]
  );

  const markItemAccessed = useCallback(async (id: string): Promise<void> => {
    try {
      await vaultItemsService.markAccessed(id);
    } catch (err) {
      console.error('Error marking item as accessed:', err);
    }
  }, []);

  const flashcards = vaultItems.filter((item): item is Flashcard => item.type === 'flashcard');

  const value: KnowledgeVaultContextType = {
    vaultItems,
    flashcards,
    flashcardDecks,
    courses,
    loading,
    error,
    refreshVaultItems,
    refreshFlashcardDecks,
    refreshCourses,
    searchItems,
    getItemsByType,
    filterItems,
    createNote,
    updateNote,
    createDocument,
    updateDocument,
    createFlashcard,
    createFlashcardDeck,
    updateFlashcard,
    createCourse,
    updateCourse,
    deleteItem,
    deleteCourse,
    markItemAccessed,
  };

  return <KnowledgeVaultContext.Provider value={value}>{children}</KnowledgeVaultContext.Provider>;
};
