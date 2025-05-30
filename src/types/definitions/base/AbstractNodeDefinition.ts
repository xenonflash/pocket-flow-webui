// src/types/definitions/base/AbstractNodeDefinition.ts
import type { NodeInputDefinition, NodeOutputDefinition, ParamSchemaItem, CodeBlockDefinition } from '@/types/pocketflow-editor';
import { AbstractBaseDefinition } from './AbstractBaseDefinition';

export abstract class AbstractNodeDefinition extends AbstractBaseDefinition {
  abstract readonly inputs: NodeInputDefinition[];
  abstract readonly outputs: NodeOutputDefinition[];
  abstract readonly defaultSize: { width: number; height: number };
  readonly sharedStateAccess?: { reads?: string[]; writes?: string[] }; // Added from base

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
    supportsCodeEditing?: boolean;
    codeBlocksDefinition?: CodeBlockDefinition[];
    sharedStateAccess?: { reads?: string[]; writes?: string[] }; // Added to constructor params
  }) {
    super(data); // Pass all common and optional fields to the base constructor
    this.sharedStateAccess = data.sharedStateAccess; // Initialize from constructor data
    // Abstract properties (inputs, outputs, defaultSize) must be set by the concrete class
  }
}
