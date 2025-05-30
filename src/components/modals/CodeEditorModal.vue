<template>
  <div v-if="show" class="code-editor-modal-overlay">
    <div class="code-editor-modal-content">
      <div class="modal-header">
        <h3>编辑 {{ currentBlockLabel }} ({{ editorLanguage }})</h3>
        <button @click="closeModal" class="close-button">&times;</button>
      </div>
      <div class="editor-container">
        <MonacoEditor
          v-model="editableCode"
          :language="editorLanguage"
          :options="editorOptions"
          theme="vs-dark"
          class="editor-instance"
        />
      </div>
      <div class="modal-footer">
        <button @click="saveCode" class="save-button">保存</button>
        <button @click="closeModal" class="cancel-button">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import MonacoEditor from 'monaco-editor-vue3';
import { useFlowStore } from '@/stores/flow';
import type { FlowNode, NodeDefinition, CodeBlockDefinition, NodeCodeBlock } from '@/types/pocketflow-editor';

const props = defineProps<{
  show: boolean;
  nodeId: string | null;
  blockName: string | null;
}>();

const emit = defineEmits<{
  (e: 'save', blockName: string, code: string): void;
  (e: 'close'): void;
}>();

const flowStore = useFlowStore();
const editableCode = ref('');
const currentLanguage = ref('python');
const currentBlockLabel = ref('代码');

const selectedNode = computed<FlowNode | null>(() => {
  if (!props.nodeId) return null;
  return flowStore.nodes.find((n: FlowNode) => n.id === props.nodeId) || null;
});

const nodeDefinition = computed<NodeDefinition | null>(() => {
  if (!selectedNode.value) return null;
  return flowStore.nodeRegistry[selectedNode.value.type] || null;
});

const currentCodeBlock = computed<NodeCodeBlock | null>(() => {
  if (!selectedNode.value || !selectedNode.value.codeBlocks || !props.blockName) return null;
  return selectedNode.value.codeBlocks[props.blockName] || null;
});

const currentBlockDefinition = computed<CodeBlockDefinition | null>(() => {
  if (!nodeDefinition.value || !nodeDefinition.value.codeBlocksDefinition || !props.blockName) return null;
  const blockDef = nodeDefinition.value.codeBlocksDefinition.find((b: CodeBlockDefinition) => b.name === props.blockName);
  return blockDef || null;
});

watch(() => [props.show, props.nodeId, props.blockName], () => {
  if (props.show && currentCodeBlock.value && currentBlockDefinition.value) {
    editableCode.value = currentCodeBlock.value.code;
    currentLanguage.value = currentCodeBlock.value.language;
    currentBlockLabel.value = currentBlockDefinition.value.label;
  } else if (!props.show) {
    editableCode.value = '';
    currentLanguage.value = 'python';
    currentBlockLabel.value = '代码';
  }
}, { immediate: true, deep: true });

const editorLanguage = computed(() => {
  return currentLanguage.value.toLowerCase();
});

const editorOptions = ref({
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 14,
});

const closeModal = () => {
  emit('close');
};

const saveCode = () => {
  if (props.blockName) {
    emit('save', props.blockName, editableCode.value);
  }
  closeModal();
};
</script>

<style scoped>
.code-editor-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.code-editor-modal-content {
  background-color: #2d2d2d; /* Dark background for the modal */
  color: #f0f0f0; /* Light text color */
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 80%;
  max-width: 900px; /* Max width of the modal */
  height: 70%;
  max-height: 700px; /* Max height of the modal */
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #444; /* Darker border */
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.4em;
}

.close-button {
  background: none;
  border: none;
  color: #f0f0f0;
  font-size: 1.8em;
  cursor: pointer;
}

.editor-container {
  flex-grow: 1;
  overflow: hidden; /* Monaco handles its own scrolling */
  border: 1px solid #444; /* Border around editor */
  border-radius: 4px;
}

.editor-instance {
  width: 100%;
  height: 100%;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  margin-top: 15px;
  border-top: 1px solid #444; /* Darker border */
}

.save-button,
.cancel-button {
  padding: 10px 18px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.2s ease;
}

.save-button {
  background-color: #007bff; /* Primary blue */
  color: white;
}

.save-button:hover {
  background-color: #0056b3;
}

.cancel-button {
  background-color: #6c757d; /* Secondary gray */
  color: white;
}

.cancel-button:hover {
  background-color: #545b62;
}
</style>
