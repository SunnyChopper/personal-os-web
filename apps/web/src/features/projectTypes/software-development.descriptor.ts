import type { ProjectTypeDescriptor } from '@/features/projectTypes/registry';
import { SoftwareKanbanView } from '@/features/projectTypes/components/SoftwareKanbanView';
import { SoftwareDevelopmentMetadataFields } from '@/features/projectTypes/components/SoftwareDevelopmentMetadataFields';
import { SoftwareDevelopmentDetailSections } from '@/features/projectTypes/components/SoftwareDevelopmentDetailSections';
import { SoftwareDevelopmentCardBadges } from '@/features/projectTypes/components/SoftwareDevelopmentCardBadges';

export const softwareDevelopmentProjectType: ProjectTypeDescriptor = {
  id: 'SoftwareDevelopment',
  label: 'Software development',
  shortLabel: 'Software',
  description: 'Repositories, stack, deployments, kanban task board, and task kinds.',
  CreateFields: SoftwareDevelopmentMetadataFields,
  EditFields: SoftwareDevelopmentMetadataFields,
  DetailSections: SoftwareDevelopmentDetailSections,
  CardBadges: SoftwareDevelopmentCardBadges,
  extraViewModes: [{ id: 'kanban', label: 'Kanban', Component: SoftwareKanbanView }],
  taskKinds: [
    { value: 'Bug', label: 'Bug', tone: 'danger' },
    { value: 'Feature', label: 'Feature', tone: 'info' },
    { value: 'Chore', label: 'Chore', tone: 'neutral' },
    { value: 'Spike', label: 'Spike', tone: 'info' },
  ],
};
