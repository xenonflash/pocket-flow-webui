<template>
  <div v-if="show" class="code-editor-modal-overlay">
    <div class="code-editor-modal-content">
      <div class="modal-header">
        <h3>编辑 {{ currentBlockLabel }} ({{ editorLanguage }})</h3>
        <button @click="closeModal" class="close-button">&times;</button>
      </div>
      <div class="editor-container">
        <MonacoEditor
          ref="monacoEditorRef"
          :modelValue="editableCode"
          @change="handleEditorChange"
          @editor-did-mount="handleEditorDidMount" 
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
import { ref, watch, computed } from 'vue'; // Removed nextTick as it's no longer used in watch
import MonacoEditor from 'monaco-editor-vue3'; // Default import
import type { editor as MonacoEditorAPI } from 'monaco-editor'; // Import Monaco's editor API types
import { useFlowStore } from '@/stores/flow';
import type { FlowNode, NodeDefinition, CodeBlockDefinition, NodeCodeBlock } from '@/types/pocketflow-editor';

// Define an interface for the expected exposed methods/properties of the MonacoEditor component instance
interface MonacoEditorVueExposed {
  getEditor?: () => MonacoEditorAPI.IStandaloneCodeEditor | undefined;
  // If the editor instance is directly exposed as a property, it might look like:
  // editor?: MonacoEditorAPI.IStandaloneCodeEditor;
}

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
const editableCode = ref(''); // Will be updated by handleEditorChange
const currentLanguage = ref('python');
const currentBlockLabel = ref('代码');

// Type the ref with our custom interface
const monacoEditorRef = ref<MonacoEditorVueExposed | null>(null);

const selectedNode = computed<FlowNode | null>(() => {
  if (!props.nodeId) return null;
  return flowStore.flowState.nodes.find(n => n.id === props.nodeId) || null;
});

const nodeDefinition = computed<NodeDefinition | null>(() => {
  if (!selectedNode.value) return null;
  return flowStore.nodeRegistry[selectedNode.value.type] || null;
});

const currentBlockDefinition = computed<CodeBlockDefinition | null>(() => {
  if (!nodeDefinition.value || !props.blockName) return null;
  return nodeDefinition.value.codeBlocksDefinition?.find(b => b.name === props.blockName) || null;
});

const currentCodeBlock = computed<NodeCodeBlock | null>(() => {
  if (!selectedNode.value || !props.blockName) return null;
  return selectedNode.value.codeBlocks?.[props.blockName] || null;
});

watch(() => [props.show, props.nodeId, props.blockName], () => { // Watch is no longer async
  console.log(`[CodeEditorModal] Watch triggered. Show: ${props.show}, NodeID: ${props.nodeId}, BlockName: ${props.blockName}`);
  if (props.show && selectedNode.value && props.blockName) {
    console.log(`[CodeEditorModal] Attempting to load code. Selected Node ID: ${selectedNode.value.id}`);
    
    const codeBlock = currentCodeBlock.value;
    const blockDef = currentBlockDefinition.value;

    console.log(`[CodeEditorModal] Current Code Block from store:`, codeBlock ? JSON.parse(JSON.stringify(codeBlock)) : null);
    console.log(`[CodeEditorModal] Current Block Definition:`, blockDef ? JSON.parse(JSON.stringify(blockDef)) : null);

    let newCodeToSet = '';
    if (codeBlock && blockDef) {
      newCodeToSet = codeBlock.code;
      currentLanguage.value = codeBlock.language || blockDef.language;
      currentBlockLabel.value = blockDef.label;
      console.log(`[CodeEditorModal] Editor state updated. Initial EditableCode will be set. Length: ${newCodeToSet.length}, Language: ${currentLanguage.value}, Label: ${currentBlockLabel.value}`);
    } else {
      console.warn("[CodeEditorModal] Conditions not met to update editor state: currentCodeBlock or currentBlockDefinition is null/undefined.");
      newCodeToSet = `// Error: Could not load code for block '${props.blockName}'. Node ID: ${props.nodeId}`;
      if (blockDef) {
        currentLanguage.value = blockDef.language;
        currentBlockLabel.value = blockDef.label;
      } else {
        currentLanguage.value = 'plaintext';
        currentBlockLabel.value = props.blockName || 'Code';
      }
       console.log(`[CodeEditorModal] Fallback state. EditableCode will be set to: ${newCodeToSet}, Language: ${currentLanguage.value}, Label: ${currentBlockLabel.value}`);
    }
    
    editableCode.value = newCodeToSet;
    // Removed nextTick and setValue logic from here, will be handled by @editor-did-mount

  } else if (!props.show) {
    editableCode.value = ''; // Reset when modal is hidden
    currentLanguage.value = 'python';
    currentBlockLabel.value = '代码';
    console.log("[CodeEditorModal] Modal closed. Editor state reset.");
  }
}, { immediate: true, deep: true });


const editorLanguage = computed(() => {
  return currentLanguage.value || 'python';
});

const editorOptions = ref({
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 14,
  // Add any other Monaco options here
});

const handleEditorDidMount = (editor: MonacoEditorAPI.IStandaloneCodeEditor) => {
  console.log(`[CodeEditorModal] @editor-did-mount triggered.`);
  if (editableCode.value !== editor.getValue()) {
    console.log(`[CodeEditorModal] @editor-did-mount: Editor content ("${editor.getValue().substring(0,50)}...") differs from model ("${editableCode.value.substring(0,50)}..."). Forcing setValue.`);
    editor.setValue(editableCode.value);
  } else {
    console.log(`[CodeEditorModal] @editor-did-mount: Editor content matches model. No need to force setValue.`);
  }
  // You might want to focus the editor here if desired
  // editor.focus(); 
};

const handleEditorChange = (newCode: string, _event: MonacoEditorAPI.IModelContentChangedEvent) => {
  editableCode.value = newCode;
  console.log(`[CodeEditorModal] Editor @change event. editableCode updated. New Length: ${newCode.length}`);
};

const closeModal = () => {
  emit('close');
};

const saveCode = () => {
  // editableCode.value is now considered the source of truth, updated by @change
  console.log(`[CodeEditorModal] Attempting to save. Code from editableCode.value (updated by @change). Length: ${editableCode.value.length}`);
  
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
  background-color: #2d2d2d; /* Darker background for the modal */
  color: #f0f0f0; /* Light text color */
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  width: 80vw;
  max-width: 1000px;
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #444; /* Subtle border */
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
  overflow: hidden; /* Important for Monaco layout */
  border: 1px solid #444;
  border-radius: 4px;
}

.editor-instance {
  width: 100%;
  height: 100%;
}

.modal-footer {
  padding-top: 15px;
  margin-top: 15px;
  border-top: 1px solid #444; /* Subtle border */
  display: flex;
  justify-content: flex-end;
}

.modal-footer button {
  padding: 10px 20px;
  margin-left: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

.save-button {
  background-color: #007acc; /* VS Code blue */
  color: white;
}

.save-button:hover {
  background-color: #005fa3;
}

.cancel-button {
  background-color: #555; /* Darker gray */
  color: white;
}

.cancel-button:hover {
  background-color: #333;
}
</style>
