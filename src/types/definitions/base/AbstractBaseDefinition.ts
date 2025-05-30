// src/types/definitions/base/AbstractBaseDefinition.ts
import type {
  ParamSchemaItem,
  NodeInputDefinition,
  NodeOutputDefinition,
  CodeBlockDefinition,
  BaseDefinitionParams
} from '@/types/pocketflow-editor';

export abstract class AbstractBaseDefinition {
  readonly type: string;
  readonly label: string;
  readonly pocketflowClass: string;
  readonly category: string;
  readonly description?: string;
  readonly defaultParams: Record<string, any>;
  readonly paramSchema: Record<string, ParamSchemaItem>;
  readonly icon?: string;
  readonly color?: string;
  readonly defaultSize?: { width: number; height: number };
  readonly inputs: NodeInputDefinition[];
  readonly outputs: NodeOutputDefinition[];
  readonly supportsCodeEditing: boolean;
  readonly codeBlocksDefinition?: CodeBlockDefinition[];
  readonly isContainer: boolean;

  constructor(params: BaseDefinitionParams) {
    // Detailed logging at the start of the constructor
    console.log(
      `[AbstractBaseDefinition] Constructor called. Incoming params type: '${params.type}', label: '${params.label}', category: '${params.category}'`
    );
    // console.log('[AbstractBaseDefinition] Full incoming params:', JSON.parse(JSON.stringify(params)));

    this.type = params.type;
    if (typeof this.type === 'undefined') {
      console.error(`[AbstractBaseDefinition] ERROR: this.type is UNDEFINED after assignment from params.type: '${params.type}'`);
    }

    this.label = params.label;
    if (typeof this.label === 'undefined') {
      console.error(`[AbstractBaseDefinition] ERROR: this.label is UNDEFINED after assignment from params.label: '${params.label}'`);
    }

    this.pocketflowClass = params.pocketflowClass;
    if (typeof this.pocketflowClass === 'undefined') {
      console.error(`[AbstractBaseDefinition] ERROR: this.pocketflowClass is UNDEFINED after assignment from params.pocketflowClass: '${params.pocketflowClass}'`);
    }

    this.category = params.category;
    if (typeof this.category === 'undefined') {
      console.error(`[AbstractBaseDefinition] ERROR: this.category is UNDEFINED after assignment from params.category: '${params.category}'`);
    }

    this.description = params.description;
    this.defaultParams = params.defaultParams || {};
    this.paramSchema = params.paramSchema || {};
    this.icon = params.icon;
    this.color = params.color;
    this.defaultSize = params.defaultSize;
    this.inputs = params.inputs || [];
    this.outputs = params.outputs || [];
    this.supportsCodeEditing = params.supportsCodeEditing || false;
    this.codeBlocksDefinition = params.codeBlocksDefinition;
    this.isContainer = params.isContainer || false;

    // Detailed logging at the end of the constructor
    console.log(
      `[AbstractBaseDefinition] Instance created. this.type: '${this.type}', this.label: '${this.label}', this.category: '${this.category}'`
    );
    // For more detailed inspection in browser console if needed:
    // console.log('[AbstractBaseDefinition] Final 'this' state:', this);
  }
}
