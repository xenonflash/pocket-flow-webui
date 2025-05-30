// src/types/definitions/flows/PfFlowDefinition.ts
import { AbstractFlowDefinition } from '@/types/definitions/base/AbstractFlowDefinition';
import type { ParamSchemaItem } from '@/types/pocketflow-editor';

export class PfFlowDefinition extends AbstractFlowDefinition {
  constructor() {
    super({
      type: 'pf.Flow',
      label: '流程 (Flow)',
      pocketflowClass: 'pf.Flow',
      category: '流程控制',
      paramSchema: {
        name: { type: 'string', label: '名称', defaultValue: 'flow', required: true, description: '流程的唯一名称。' },
        description: { type: 'string', label: '描述', defaultValue: '', required: false, description: '流程的可选描述。' },
        // `nodes` and `start_node_name` are instance-specific, not part of the definition for the palette
      },
      defaultParams: {
        name: 'flow',
        description: '',
      },
      inputs: [
        { id: 'flow_input', label: '开始', position: { side: 'left', offset: 0.5 }, description: '启动流程的输入点。' }
      ],
      outputs: [
        { id: 'flow_output_success', label: '成功', position: { side: 'right', offset: 0.33 }, description: '流程成功完成时触发。' },
        { id: 'flow_output_failure', label: '失败', position: { side: 'right', offset: 0.66 }, description: '流程执行失败时触发。' }
      ],
      defaultSize: { width: 200, height: 100 },
      description: 'PocketFlow 中的基本同步流程。',
      icon: 'mdi-lan',
      color: '#2196F3', // Blue
      isContainer: true,
      supportsCodeEditing: false, // Flows typically orchestrate, not execute custom code blocks themselves
    });
  }
}
