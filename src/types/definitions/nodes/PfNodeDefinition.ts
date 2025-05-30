// src/types/definitions/nodes/PfNodeDefinition.ts
import { AbstractNodeDefinition } from '@/types/definitions/base/AbstractNodeDefinition';
import type { NodeInputDefinition, NodeOutputDefinition, ParamSchemaItem, CodeBlockDefinition } from '@/types/pocketflow-editor';

export class PfNodeDefinition extends AbstractNodeDefinition {
  readonly type = 'pf.Node';
  readonly label = '基础节点 (Node)';
  readonly pocketflowClass = 'pf.Node';
  readonly category = '核心';
  readonly defaultSize = { width: 200, height: 120 };

  readonly paramSchema: Record<string, ParamSchemaItem> = {
    name: { type: 'string', label: '名称', defaultValue: 'node', required: true, description: '节点的唯一名称。' },
    max_retries: { type: 'number', label: '最大重试次数', defaultValue: 1, validation: { min: 0 }, description: '执行失败时的最大重试次数。' },
    wait: { type: 'number', label: '重试等待时间 (秒)', defaultValue: 0, validation: { min: 0 }, description: '每次重试之间的等待时间。' },
  };
  readonly defaultParams: Record<string, any> = {
    name: 'node',
    max_retries: 1,
    wait: 0,
  };

  readonly inputs: NodeInputDefinition[] = [
    { id: 'input_default', label: '输入', position: { side: 'top', offset: 0.5 }, description: '默认输入点' }
  ];
  readonly outputs: NodeOutputDefinition[] = [
    { id: 'success', label: '成功', position: { side: 'bottom', offset: 0.33 }, description: '当节点成功执行时触发。' },
    { id: 'failure', label: '失败', position: { side: 'bottom', offset: 0.66 }, description: '当节点执行失败时触发。' }
  ];

  constructor() {
    super({
      type: 'pf.Node',
      label: '基础节点 (Node)',
      pocketflowClass: 'pf.Node',
      category: '核心',
      paramSchema: {
        name: { type: 'string', label: '名称', defaultValue: 'node', required: true, description: '节点的唯一名称。' },
        max_retries: { type: 'number', label: '最大重试次数', defaultValue: 1, validation: { min: 0 }, description: '执行失败时的最大重试次数。' },
        wait: { type: 'number', label: '重试等待时间 (秒)', defaultValue: 0, validation: { min: 0 }, description: '每次重试之间的等待时间。' },
      },
      defaultParams: { name: 'node', max_retries: 1, wait: 0 },
      inputs: [
        { id: 'input_default', label: '输入', position: { side: 'top', offset: 0.5 }, description: '默认输入点' }
      ],
      outputs: [
        { id: 'success', label: '成功', position: { side: 'bottom', offset: 0.33 }, description: '当节点成功执行时触发。' },
        { id: 'failure', label: '失败', position: { side: 'bottom', offset: 0.66 }, description: '当节点执行失败时触发。' }
      ],
      defaultSize: { width: 200, height: 120 },
      description: 'PocketFlow 中的基础同步节点。',
      icon: 'mdi-cube-outline',
      color: '#4CAF50',
      supportsCodeEditing: true,
      codeBlocksDefinition: [
        {
          name: 'prep',
          label: '准备脚本 (prep)',
          language: 'python',
          defaultCode: '# prep(self, shared_data)\n# 在 exec 之前运行，用于准备数据\n# 返回值将传递给 exec\npass',
          description: '准备阶段执行的 Python 代码。'
        },
        {
          name: 'exec',
          label: '执行脚本 (exec)',
          language: 'python',
          defaultCode: '# exec(self, prep_result)\n# 核心执行逻辑\n# 返回值将传递给 post\nprint(f"Executing {self.params.get(\'name\', \'Node\')} with prep_result: {prep_result}")\nreturn prep_result',
          description: '核心逻辑执行的 Python 代码。'
        },
        {
          name: 'post',
          label: '后处理脚本 (post)',
          language: 'python',
          defaultCode: '# post(self, shared_data, prep_result, exec_result)\n# 在 exec 之后运行，用于清理或处理结果\n# 返回值将作为节点的最终输出 (如果适用)\nreturn exec_result',
          description: '后处理阶段执行的 Python 代码。'
        },
        {
          name: 'exec_fallback',
          label: '回退脚本 (exec_fallback)',
          language: 'python',
          defaultCode: '# exec_fallback(self, prep_result, exception)\n# 当 exec 抛出异常且所有重试都失败时运行\nprint(f"Fallback for {self.params.get(\'name\', \'Node\')} due to: {exception}")\nraise exception # 默认重新抛出异常',
          description: '当 exec 方法失败时的回退逻辑。'
        }
      ]
    });
  }
}
