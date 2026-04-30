import type { ConceptSynthesis, ConceptNode } from '@/types/concept-graph';
import { llmLogger } from '@/lib/logger';
import { conceptGraphService } from '@/services/knowledge-vault/concept-graph.service';

export const conceptSynthesisService = {
  async generateSynthesis(node1: ConceptNode, node2: ConceptNode): Promise<ConceptSynthesis> {
    try {
      const res = await conceptGraphService.synthesize([node1.id, node2.id]);
      if (res.success && res.data?.markdown) {
        return {
          synthesis: res.data.markdown,
          insights: [],
          applications: [],
          connectionStrength: 0.85,
        };
      }
    } catch (error) {
      llmLogger.error('Error generating synthesis', error);
    }
    return this.generateFallbackSynthesis(node1, node2);
  },

  generateFallbackSynthesis(node1: ConceptNode, node2: ConceptNode): ConceptSynthesis {
    return {
      synthesis: `Combining "${node1.label}" from ${node1.area} with "${node2.label}" from ${node2.area} creates interesting opportunities for cross-domain thinking. These concepts share underlying patterns that can inform new approaches to problem-solving and personal growth.`,
      insights: [
        `The principles of ${node1.label} can enhance understanding of ${node2.label}`,
        `Both concepts operate on similar fundamental patterns`,
        `This synthesis enables multi-dimensional analysis`,
      ],
      applications: [
        `Apply ${node1.label} frameworks to ${node2.label} challenges`,
        `Use insights from both domains to create hybrid approaches`,
        `Develop integrated mental models combining both perspectives`,
      ],
      connectionStrength: 5,
    };
  },
};
