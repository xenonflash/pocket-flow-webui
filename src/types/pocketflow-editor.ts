/**
 * 定义参数的结构，用于属性编辑器
 */
export interface ParamSchemaItem {
  type: 'string' | 'number' | 'boolean' | 'json' | 'select' | 'textarea'; // 参数类型
  label: string; // 在属性编辑器中显示的标签
  defaultValue?: any; // 默认值
  options?: Array<{ value: any; label: string }>; // 针对 select 类型的选项
  description?: string; // 参数描述
  required?: boolean;
  placeholder?: string; // 输入字段的占位符
  validation?: { // 参数验证规则
    pattern?: string; // 正则表达式字符串
    min?: number; // 数字类型的最小值
    max?: number; // 数字类型的最大值
    step?: number; // 数字类型的步长
    minLength?: number; // 字符串类型的最小长度
    maxLength?: number; // 字符串类型的最大长度
    custom?: (value: any, allParams: Record<string, any>) => boolean | string; // 自定义验证函数，返回 true 或错误消息
  };
  rows?: number; // for textarea type
}

/**
 * Defines common properties for a connection point (handle) on a node.
 */
export interface NodeConnectionPoint {
  id: string; // Unique ID for this connection point within the node (e.g., "input_data", "output_result")
  label: string; // Display label for the UI
  description?: string;
  // Position on the node's boundary.
  // 'left', 'right', 'top', 'bottom' imply a point on that side.
  // The 'offset' is relative to the side's length (0 to 1).
  // e.g., { side: 'left', offset: 0.5 } for middle of left side.
  // e.g., { side: 'top', offset: 0.25 } for 25% from the start of the top side.
  // If offset is not provided, it defaults to 0.5 (center).
  position: {
    side: 'top' | 'bottom' | 'left' | 'right';
    offset?: number; 
  };
  type?: string; // Optional: e.g., 'data', 'control', 'event' - for styling or validation logic
  maxConnections?: number; // Defines how many edges can connect to this point.
}

/**
 * Defines an input connection point on a node.
 */
export interface NodeInputDefinition extends NodeConnectionPoint {
  allowedSourceNodeTypes?: string[]; // Restrict which node types can connect
  allowedSourceOutputIds?: string[]; // Restrict which specific output point IDs from source nodes can connect
  // maxConnections typically defaults to 1 or a specific number for inputs.
}

/**
 * Defines an output connection point on a node.
 * The 'id' of an output point corresponds to a logical output/action of the node.
 */
export interface NodeOutputDefinition extends NodeConnectionPoint {
  // maxConnections typically defaults to Infinity for outputs.
}

/**
 * 定义一个节点类型（例如，对应 pocketflow.py 中的一个类）
 */
export interface NodeDefinition {
  type: string; // 节点的唯一类型标识符, e.g., "pf.Node", "pf.CustomAsyncNode"
  label: string; // 在组件选择面板中显示的名称
  description?: string; // 节点类型的描述
  pocketflowClass: string; // 对应的 pocketflow.py 中的 Python 类名
  defaultParams: Record<string, any>; // 创建节点时的默认参数
  paramSchema: Record<string, ParamSchemaItem>; // 参数的结构定义，用于生成属性面板

  // 视觉和分类
  icon?: string; // 节点的图标 (e.g., Material Design Icon name, SVG string, or image URL)
  color?: string; // 节点的默认主题颜色 (e.g., for node background or border)
  category: string; // 节点在组件选择面板中的分类 (e.g., "Core", "Async", "Data Processing", "Custom")
  defaultSize?: { width: number; height: number }; // 节点的默认尺寸

  // 定义节点的输入连接点
  inputs?: NodeInputDefinition[];

  // 定义节点的输出连接点 (replaces the old outputActions)
  // The 'id' in NodeOutputDefinition will be used by FlowEdge.sourceOutputId
  outputs?: NodeOutputDefinition[];

  // Code editing capabilities
  supportsCodeEditing?: boolean; // Whether this node type supports inline code editing
  codeBlocksDefinition?: CodeBlockDefinition[]; // Defines editable code blocks for this node type

  // OLD outputActions - to be removed or mapped from 'outputs'
  // outputActions: Array<{
  //   id: string;
  //   label: string;
  //   description?: string;
  // }>;

  // 可选：定义节点的输入连接点 (如果需要更明确的控制)
  // inputHandles?: Array<{ id: string; label: string; description?: string; allowedSourceNodeTypes?: string[]; allowedSourceActions?: string[]; }>;
}

/**
 * Defines a single editable code block for a node type.
 */
export interface CodeBlockDefinition {
  name: string; // e.g., "exec", "prep", "post"
  label: string; // UI label, e.g., "Execute Logic", "Preparation Script"
  language: 'python' | 'javascript';
  defaultCode: string;
  description?: string;
}

/**
 * 画布上的一个节点实例
 */
export interface FlowNode {
  id: string; // 节点实例的唯一ID
  type: string; // 节点的类型，关联到 NodeDefinition.type
  label: string; // 节点实例的显示名称 (可由用户修改)
  position: { x: number; y: number }; // 节点在画布上的位置
  params: Record<string, any>; // 节点实例的参数，根据 NodeDefinition.paramSchema 初始化和编辑

  // Instance-specific code (if supported by NodeDefinition and edited by user)
  codeBlocks?: Record<string, NodeCodeBlock>; // Stores the actual code for each block, keyed by CodeBlockDefinition.name

  // 实例特定的视觉和尺寸
  size?: { width: number; height: number }; // 如果节点允许用户调整大小
  customVisuals?: { // 允许用户覆盖节点定义中的默认视觉效果
    color?: string; 
    icon?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  notes?: string; // 用户为节点实例添加的备注
}

/**
 * Represents an actual code block instance on a FlowNode.
 */
export interface NodeCodeBlock {
  code: string;
  language: 'python' | 'javascript';
}

/**
 * 画布上的一条连接线（边）
 */
export interface FlowEdge {
  id: string; // 连接线的唯一ID
  sourceNodeId: string; // 源节点 ID
  sourceOutputId: string; // 源节点的输出点 ID (对应 NodeDefinition.outputs[].id)
  targetNodeId: string; // 目标节点 ID
  targetInputId: string; // 目标节点的输入点 ID (对应 NodeDefinition.inputs[].id)
  label?: string; // 连接线上显示的文本

  // 视觉样式和类型
  style?: { 
    stroke?: string; // 连接线颜色
    strokeWidth?: number; // 连接线宽度
  };
  lineType?: 'default' | 'smoothstep' | 'step' | 'straight'; // 连接线的形状
  animated?: boolean; // 是否显示动画效果
}

/**
 * 整个流程图的状态
 */
export interface FlowState {
  id?: string; // 流程图的唯一ID (例如，从后端加载时)
  name?: string; // 流程图的名称
  description?: string; // 流程图的描述
  version?: string; // 版本号

  nodes: FlowNode[];
  edges: FlowEdge[];
  
  flowParams: Record<string, any>; // 整个流程的全局参数 (对应 Flow 基类的 params)
  // paramSchemaForFlow?: Record<string, ParamSchemaItem>; // 如果全局参数也需要 schema 来编辑

  selectedNodeId?: string | null; // 当前选中的节点ID
  selectedEdgeId?: string | null; // 当前选中的连接线ID

  // 画布视图状态
  viewport: { 
    x: number; // 画布横向平移
    y: number; // 画布纵向平移
    zoom: number; // 画布缩放级别
  };

  // 编辑器设置
  editorSettings: {
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize?: number;
  };
}

/**
 * 节点注册表，用于存储所有可用的节点定义
 */
export type NodeRegistry = Record<string, NodeDefinition>;

/**
 * 用于初始化新流程的配置
 */
export interface NewFlowConfig {
  name: string;
  description?: string;
  flowParams?: Record<string, any>;
}
