import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, AlertTriangle, Target } from 'lucide-react';
import type { Metric, MetricLog } from '@/types/growth-system';
import {
  metricPredictionsService,
  type PredictionResult,
  type TargetDatePrediction,
} from '@/services/growth-system/metric-predictions.service';
import { MetricTimeSeriesChart } from './MetricTimeSeriesChart';

interface MetricPredictionsProps {
  metric: Metric;
  logs: MetricLog[];
}

export function MetricPredictions({ metric, logs }: MetricPredictionsProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [targetDate, setTargetDate] = useState<TargetDatePrediction | null>(null);
  const [risk, setRisk] = useState<{
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
    confidence: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPredictions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [predResult, targetResult, riskResult] = await Promise.all([
        metricPredictionsService.predictValue(metric, logs, 30),
        metric.targetValue
          ? metricPredictionsService.predictTargetDate(metric, logs)
          : Promise.resolve({ data: null, success: true, error: null }),
        metric.targetValue
          ? metricPredictionsService.predictRisk(metric, logs)
          : Promise.resolve({ data: null, success: true, error: null }),
      ]);

      if (predResult.success && predResult.data) {
        setPrediction(predResult.data);
      }
      if (targetResult.success && targetResult.data) {
        setTargetDate(targetResult.data);
      }
      if (riskResult.success && riskResult.data) {
        setRisk(riskResult.data);
      }
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [metric, logs]);

  useEffect(() => {
    if (logs.length >= 3) {
      loadPredictions();
    }
  }, [logs.length, loadPredictions]);

  if (logs.length < 3) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="mb-2">Need more data for predictions</p>
        <p className="text-sm">Log at least 3 values to see predictions</p>
      </div>
    );
  }

  const unit = metric.unit === 'custom' ? metric.customUnit || '' : metric.unit;

  return (
    <div className="space-y-6">
      {/* Prediction Chart */}
      <MetricTimeSeriesChart
        metric={metric}
        logs={logs}
        height={300}
        showTarget={true}
        showTrend={true}
        showAnomalies={false}
        showPrediction={true}
        showComparison={false}
      />

      {/* 30-Day Prediction */}
      {prediction && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            30-Day Forecast
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Predicted Value</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {prediction.futureValue.toFixed(metric.unit === 'dollars' ? 0 : 1)} {unit}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Confidence: {(prediction.confidence * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Confidence Interval
              </div>
              <div className="text-sm text-gray-900 dark:text-white">
                {prediction.confidenceInterval.lower.toFixed(metric.unit === 'dollars' ? 0 : 1)} -{' '}
                {prediction.confidenceInterval.upper.toFixed(metric.unit === 'dollars' ? 0 : 1)}{' '}
                {unit}
              </div>
              <div
                className={`text-xs font-medium mt-1 ${
                  prediction.riskLevel === 'low'
                    ? 'text-green-600 dark:text-green-400'
                    : prediction.riskLevel === 'medium'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                }`}
              >
                Risk: {prediction.riskLevel}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Target Date Prediction */}
      {targetDate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Target Date Prediction
          </h3>
          {targetDate.targetDate ? (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Projected to reach target on
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {new Date(targetDate.targetDate).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Confidence: {(targetDate.confidence * 100).toFixed(0)}%
              </div>
              {targetDate.riskFactors.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="text-xs text-yellow-800 dark:text-yellow-200">
                      <div className="font-medium mb-1">Risk Factors:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {targetDate.riskFactors.map((factor, i) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p className="text-sm">Unable to predict target date</p>
              {targetDate.riskFactors.length > 0 && (
                <p className="text-xs mt-1">{targetDate.riskFactors[0]}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Risk Assessment */}
      {risk && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Risk Assessment
          </h3>
          <div
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
              risk.riskLevel === 'low'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : risk.riskLevel === 'medium'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {risk.riskLevel.toUpperCase()} Risk
          </div>
          {risk.riskFactors && risk.riskFactors.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Risk Factors:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {risk.riskFactors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
          {risk.recommendations && risk.recommendations.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Recommendations:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {risk.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
