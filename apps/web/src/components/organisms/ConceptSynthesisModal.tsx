import { useState } from 'react';
import { X, Sparkles, Brain, Zap, ArrowRight, Save, Loader } from 'lucide-react';
import type { ConceptNode, ConceptSynthesis } from '@/types/concept-graph';
import { getAreaColor } from '@/constants/growth-system';

interface ConceptSynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  node1: ConceptNode;
  node2: ConceptNode;
  synthesis: ConceptSynthesis | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onSave: (connectionStrength: number) => void;
}

export default function ConceptSynthesisModal({
  isOpen,
  onClose,
  node1,
  node2,
  synthesis,
  isGenerating,
  onGenerate,
  onSave,
}: ConceptSynthesisModalProps) {
  const [connectionStrength, setConnectionStrength] = useState(synthesis?.connectionStrength ?? 5);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(connectionStrength);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Concept Synthesis</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exploring connections between concepts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2"
                style={{
                  backgroundColor: getAreaColor(node1.area) + '20',
                  color: getAreaColor(node1.area),
                }}
              >
                {node1.area}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {node1.label}
              </h3>
              {node1.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{node1.description}</p>
              )}
              {node1.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {node1.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2"
                style={{
                  backgroundColor: getAreaColor(node2.area) + '20',
                  color: getAreaColor(node2.area),
                }}
              >
                {node2.area}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {node2.label}
              </h3>
              {node2.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{node2.description}</p>
              )}
              {node2.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {node2.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!synthesis && !isGenerating && (
            <div className="text-center py-12">
              <Sparkles size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ready to Synthesize
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Generate insights by analyzing the connection between these concepts
              </p>
              <button
                onClick={onGenerate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition"
              >
                <Sparkles size={20} />
                <span>Generate Synthesis</span>
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12">
              <Loader size={48} className="text-purple-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Analyzing Connections...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our AI is exploring the relationship between these concepts
              </p>
            </div>
          )}

          {synthesis && !isGenerating && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={24} className="text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Synthesis</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {synthesis.synthesis}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Key Insights
                    </h4>
                  </div>
                  <ul className="space-y-3">
                    {synthesis.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <ArrowRight size={20} className="text-purple-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={20} className="text-pink-600 dark:text-pink-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Applications
                    </h4>
                  </div>
                  <ul className="space-y-3">
                    {synthesis.applications.map((application, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <ArrowRight size={20} className="text-pink-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {application}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Connection Strength
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={connectionStrength}
                    onChange={(e) => setConnectionStrength(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-gray-900 dark:text-white w-8 text-center">
                    {connectionStrength}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Rate how strong you think this connection is (1 = weak, 10 = very strong)
                </p>
              </div>
            </div>
          )}
        </div>

        {synthesis && !isGenerating && (
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition"
            >
              <Save size={20} />
              <span>Save Connection</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
