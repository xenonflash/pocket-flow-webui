// src/types/definitions/flows/PfBatchFlowDefinition.ts
import { AbstractFlowDefinition } from '@/types/definitions/base/AbstractFlowDefinition';
import type { ParamSchemaItem } from '@/types/pocketflow-editor';

export class PfBatchFlowDefinition extends AbstractFlowDefinition {
  constructor() {
    super({
      type: 'pf.BatchFlow',
      label: '批处理流程 (BatchFlow)',
      pocketflowClass: 'pf.BatchFlow',
      category: '流程控制',
      paramSchema: {
        name: { type: 'string', label: '名称', defaultValue: 'batch_flow', required: true, description: '流程的唯一名称。' },
        description: { type: 'string', label: '描述', defaultValue: '', required: false, description: '流程的可选描述。' },
        batch_param: { type: 'string', label: '批处理参数名', defaultValue: 'batch_data', required: true, description: '输入数据中包含批处理数据的键名。' },
        // `nodes` and `start_node_name` are instance-specific
      },
      defaultParams: {
        name: 'batch_flow',
        description: '',
        batch_param: 'batch_data',
      },
      inputs: [
        { id: 'flow_input', label: '开始', position: { side: 'left', offset: 0.5 }, description: '启动流程的输入点，应包含批处理参数指定的数据。' }
      ],
      outputs: [
        { id: 'flow_output_success', label: '成功', position: { side: 'right', offset: 0.33 }, description: '流程成功完成时触发。' },
        { id: 'flow_output_failure', label: '失败', position: { side: 'right', offset: 0.66 }, description: '流程执行失败时触发。' }
      ],
      defaultSize: { width: 220, height: 120 },
      description: 'PocketFlow 中的同步批处理流程。',
      icon: 'mdi-lan-pending',
      color: '#03A9F4', // Light Blue
      isContainer: true,
      supportsCodeEditing: false,
    });
  }
}
