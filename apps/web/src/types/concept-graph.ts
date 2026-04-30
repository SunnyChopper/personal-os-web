import type { Area } from './growth-system';

export interface ConceptNode {
  id: string;
  label: string;
  description?: string;
  area: Area;
  tags: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
}

export interface ConceptEdge {
  id: string;
  source: string;
  target: string;
  synthesisInsight: string;
  connectionStrength: number;
  createdAt: string;
}

export interface ConceptSynthesis {
  synthesis: string;
  insights: string[];
  applications: string[];
  connectionStrength: number;
}

export interface ConceptGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface CreateConceptNodeInput {
  label: string;
  description?: string;
  area: Area;
  tags?: string[];
}

export interface UpdateConceptNodeInput {
  label?: string;
  description?: string;
  area?: Area;
  tags?: string[];
}

export interface CreateConceptEdgeInput {
  source: string;
  target: string;
  synthesisInsight: string;
  connectionStrength: number;
}

export interface GraphViewport {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}
