// src/types/definitions/flows/PfAsyncParallelBatchFlowDefinition.ts
import { AbstractFlowDefinition } from '@/types/definitions/base/AbstractFlowDefinition';
import type { ParamSchemaItem } from '@/types/pocketflow-editor';

export class PfAsyncParallelBatchFlowDefinition extends AbstractFlowDefinition {
  constructor() {
    super({
      type: 'pf.AsyncParallelBatchFlow',
      label: '异步并行批处理流程 (AsyncParallelBatchFlow)',
      pocketflowClass: 'pf.AsyncParallelBatchFlow',
      category: '流程控制',
      paramSchema: {
        name: { type: 'string', label: '名称', defaultValue: 'async_parallel_batch_flow', required: true, description: '流程的唯一名称。' },
        description: { type: 'string', label: '描述', defaultValue: '', required: false, description: '流程的可选描述。' },
        batch_param: { type: 'string', label: '批处理参数名', defaultValue: 'batch_data', required: true, description: '输入数据中包含批处理数据的键名。' },
        max_parallel: { type: 'number', label: '最大并行数', defaultValue: 5, validation: { min: 1 }, description: '并行处理的最大任务数。' },
        // `nodes` and `start_node_name` are instance-specific
      },
      defaultParams: {
        name: 'async_parallel_batch_flow',
        description: '',
        batch_param: 'batch_data',
        max_parallel: 5,
      },
      inputs: [
        { id: 'flow_input', label: '开始', position: { side: 'left', offset: 0.5 }, description: '启动流程的输入点，应包含批处理参数指定的数据。' }
      ],
      outputs: [
        { id: 'flow_output_success', label: '成功', position: { side: 'right', offset: 0.33 }, description: '流程成功完成时触发。' },
        { id: 'flow_output_failure', label: '失败', position: { side: 'right', offset: 0.66 }, description: '流程执行失败时触发。' }
      ],
      defaultSize: { width: 280, height: 130 },
      description: 'PocketFlow 中的异步并行批处理流程。',
      icon: 'mdi-vector-combine',
      color: '#4CAF50', // Green
      isContainer: true,
      supportsCodeEditing: false,
    });
  }
}
