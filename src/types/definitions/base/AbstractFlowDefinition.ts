// src/types/definitions/base/AbstractFlowDefinition.ts
import type { NodeInputDefinition, NodeOutputDefinition, ParamSchemaItem, CodeBlockDefinition } from '@/types/pocketflow-editor';
import { AbstractBaseDefinition } from './AbstractBaseDefinition';

export abstract class AbstractFlowDefinition extends AbstractBaseDefinition {
  // Flows might also have inputs/outputs, but their meaning or typical structure might differ from atomic nodes.
  // For instance, a Flow might have a single trigger input and a single completion output.
  abstract readonly inputs: NodeInputDefinition[];
  abstract readonly outputs: NodeOutputDefinition[];
  abstract readonly defaultSize: { width: number; height: number }; // Flows are also rendered on canvas

  protected constructor(data: {
    type: string;
    label: string;
    pocketflowClass: string;
    category: string;
    paramSchema: Record<string, ParamSchemaItem>;
    defaultParams: Record<string, any>;
    inputs: NodeInputDefinition[];
    outputs: NodeOutputDefinition[];
    defaultSize: { width: number; height: number };
    description?: string;
    icon?: string;
    color?: string;
    supportsCodeEditing?: boolean; // Flows (like pf.Flow) have prep/post
    codeBlocksDefinition?: CodeBlockDefinition[];
  }) {
    super(data);
    // Abstract properties must be set by the concrete class
  }
}
