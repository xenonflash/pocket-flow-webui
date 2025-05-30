// src/types/definitions/nodes/PfBatchNodeDefinition.ts
import { AbstractNodeDefinition } from '@/types/definitions/base/AbstractNodeDefinition';
import type { NodeInputDefinition, NodeOutputDefinition, ParamSchemaItem } from '@/types/pocketflow-editor';

export class PfBatchNodeDefinition extends AbstractNodeDefinition {
  constructor() {
    super({
      type: 'pf.BatchNode',
      label: '批处理节点 (BatchNode)',
      pocketflowClass: 'pf.BatchNode',
      category: '核心',
      paramSchema: {
        name: { type: 'string', label: '名称', defaultValue: 'batch_node', required: true, description: '节点的唯一名称。' },
        batch_param: { type: 'string', label: '批处理参数名', defaultValue: 'batch_data', required: true, description: '输入数据中包含批处理数据的键名。' },
        max_retries: { type: 'number', label: '最大重试次数', defaultValue: 1, validation: { min: 0 }, description: '执行失败时的最大重试次数。' },
        wait: { type: 'number', label: '重试等待时间 (秒)', defaultValue: 0, validation: { min: 0 }, description: '每次重试之间的等待时间。' },
      },
      defaultParams: {
        name: 'batch_node',
        batch_param: 'batch_data',
        max_retries: 1,
        wait: 0,
      },
      inputs: [
        { id: 'input_default', label: '输入', position: { side: 'top', offset: 0.5 }, description: '默认输入点，应包含批处理参数指定的数据' }
      ],
      outputs: [
        { id: 'success', label: '成功', position: { side: 'bottom', offset: 0.33 }, description: '当节点成功执行时触发。' },
        { id: 'failure', label: '失败', position: { side: 'bottom', offset: 0.66 }, description: '当节点执行失败时触发。' }
      ],
      defaultSize: { width: 220, height: 140 },
      description: 'PocketFlow 中的同步批处理节点。',
      icon: 'mdi-animation-play-outline',
      color: '#FF9800', // Orange
      supportsCodeEditing: true,
      codeBlocksDefinition: [
        { name: 'prep', label: '准备脚本 (prep)', language: 'python', defaultCode: '# prep(self, shared_data)\n# 返回值将传递给 exec', description: '准备阶段执行的 Python 代码。' },
        { name: 'exec', label: '执行脚本 (exec)', language: 'python', defaultCode: '# exec(self, prep_result, item) \n# item 是 batch_param 中的单个元素\n# 针对批处理中的每一项执行', description: '核心逻辑执行的 Python 代码（针对每项）。' },
        { name: 'post', label: '后处理脚本 (post)', language: 'python', defaultCode: '# post(self, shared_data, prep_result, exec_results)\n# exec_results 是 exec 对所有项的返回结果列表', description: '后处理阶段执行的 Python 代码。' },
        { name: 'exec_fallback', label: '回退脚本 (exec_fallback)', language: 'python', defaultCode: '# exec_fallback(self, prep_result, item, exception)', description: '当 exec 方法失败时的回退逻辑。' }
      ]
    });
  }
}
