// src/types/definitions/nodes/PfAsyncNodeDefinition.ts
import { AbstractNodeDefinition } from '@/types/definitions/base/AbstractNodeDefinition';
import type { NodeInputDefinition, NodeOutputDefinition, ParamSchemaItem, CodeBlockDefinition } from '@/types/pocketflow-editor';

export class PfAsyncNodeDefinition extends AbstractNodeDefinition {
  readonly type = 'pf.AsyncNode';
  readonly label = '异步节点 (AsyncNode)';
  readonly pocketflowClass = 'pf.AsyncNode';
  readonly category = '核心';
  readonly defaultSize = { width: 200, height: 120 };

  readonly paramSchema: Record<string, ParamSchemaItem> = {
    name: { type: 'string', label: '名称', defaultValue: 'async_node', required: true, description: '节点的唯一名称。' },
    max_retries: { type: 'number', label: '最大重试次数', defaultValue: 1, validation: { min: 0 }, description: '执行失败时的最大重试次数。' },
    wait: { type: 'number', label: '重试等待时间 (秒)', defaultValue: 0, validation: { min: 0 }, description: '每次重试之间的等待时间。' },
  };
  readonly defaultParams: Record<string, any> = {
    name: 'async_node',
    max_retries: 1,
    wait: 0,
  };

  readonly inputs: NodeInputDefinition[] = [
    { id: 'input_default', label: '输入', position: { side: 'top', offset: 0.5 }, description: '默认异步输入点' }
  ];
  readonly outputs: NodeOutputDefinition[] = [
    { id: 'success', label: '成功', position: { side: 'bottom', offset: 0.33 }, description: '当节点成功执行时触发。' },
    { id: 'failure', label: '失败', position: { side: 'bottom', offset: 0.66 }, description: '当节点执行失败时触发。' }
  ];

  constructor() {
    super({
      type: 'pf.AsyncNode',
      label: '异步节点 (AsyncNode)',
      pocketflowClass: 'pf.AsyncNode',
      category: '核心',
      paramSchema: {
        name: { type: 'string', label: '名称', defaultValue: 'async_node', required: true, description: '节点的唯一名称。' },
        max_retries: { type: 'number', label: '最大重试次数', defaultValue: 1, validation: { min: 0 }, description: '执行失败时的最大重试次数。' },
        wait: { type: 'number', label: '重试等待时间 (秒)', defaultValue: 0, validation: { min: 0 }, description: '每次重试之间的等待时间。' },
      },
      defaultParams: { name: 'async_node', max_retries: 1, wait: 0 },
      inputs: [
        { id: 'input_default', label: '输入', position: { side: 'top', offset: 0.5 }, description: '默认异步输入点' }
      ],
      outputs: [
        { id: 'success', label: '成功', position: { side: 'bottom', offset: 0.33 }, description: '当节点成功执行时触发。' },
        { id: 'failure', label: '失败', position: { side: 'bottom', offset: 0.66 }, description: '当节点执行失败时触发。' }
      ],
      defaultSize: { width: 200, height: 120 },
      description: 'PocketFlow 中的基础异步节点。',
      icon: 'mdi-cogs',
      color: '#2196F3',
      supportsCodeEditing: true,
      codeBlocksDefinition: [
        {
          name: 'prep_async',
          label: '异步准备 (prep_async)',
          language: 'python',
          defaultCode: '# async prep_async(self, shared_data)\n# Asynchronous preparation step\npass',
          description: '异步准备阶段。'
        },
        {
          name: 'exec_async',
          label: '异步执行 (exec_async)',
          language: 'python',
          defaultCode: '# async exec_async(self, prep_result)\n# Asynchronous execution logic\nprint(f"Executing async {self.params.get(\'name\', \'AsyncNode\')} with prep_result: {prep_result}")\nreturn prep_result',
          description: '核心异步执行逻辑。'
        },
        {
          name: 'post_async',
          label: '异步后处理 (post_async)',
          language: 'python',
          defaultCode: '# async post_async(self, shared_data, prep_result, exec_result)\n# Asynchronous post-processing step\nreturn exec_result',
          description: '异步后处理阶段。'
        },
        {
          name: 'exec_fallback_async',
          label: '异步回退 (exec_fallback_async)',
          language: 'python',
          defaultCode: '# async exec_fallback_async(self, prep_result, exception)\n# Asynchronous fallback logic\nprint(f"Async fallback for {self.params.get(\'name\', \'AsyncNode\')} due to: {exception}")\nraise exception',
          description: '异步执行失败时的回退逻辑。'
        }
      ]
    });
  }
}
