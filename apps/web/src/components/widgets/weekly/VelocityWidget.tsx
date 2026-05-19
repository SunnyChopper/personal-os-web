import type { WeeklyReviewCurrentDashboard } from '@/types/growth-system';
import type { VelocityWidgetConfig, WeeklyDashboardWidget } from '@/types/weekly-dashboard';
import { VelocityChart } from '@/components/molecules/VelocityChart';

interface VelocityWidgetProps {
  widget: WeeklyDashboardWidget;
  data: WeeklyReviewCurrentDashboard;
}

export function VelocityWidget({ widget, data }: VelocityWidgetProps) {
  const cfg = widget.config as VelocityWidgetConfig;
  const rollingWindow = cfg.rollingWindow ?? 4;

  return (
    <VelocityChart
      weeks={data.velocityData}
      currentWeekStart={data.weekStart}
      rollingAverages={data.rollingAverageStoryPoints}
      rollingWindow={rollingWindow}
    />
  );
}
