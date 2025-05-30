import { ref, type Ref } from 'vue';
import { useFlowStore } from '@/stores/flow';

export function useNodeInteractions(
  canvasWrapperRef: Ref<HTMLElement | null>,
  isDrawingEdge: Ref<boolean>,
  drawingEdgePreviewLine: Ref<{ x1: number, y1: number, x2: number, y2: number } | null>
) {
  const flowStore = useFlowStore();

  const draggingNodeId = ref<string | null>(null);
  const dragOffset = ref({ x: 0, y: 0 });
  const drawingEdgeSource = ref<{ nodeId: string; outputId: string; } | null>(null);

  const selectNode = (nodeId: string) => {
    flowStore.setSelectedNode(nodeId);
  };

  const onNodeMouseMove = (event: MouseEvent) => {
    if (!draggingNodeId.value || !canvasWrapperRef.value) return;
    event.preventDefault();

    const rect = canvasWrapperRef.value.getBoundingClientRect();
    let newX = (event.clientX - rect.left - dragOffset.value.x - flowStore.flowState.viewport.x) / flowStore.flowState.viewport.zoom;
    let newY = (event.clientY - rect.top - dragOffset.value.y - flowStore.flowState.viewport.y) / flowStore.flowState.viewport.zoom;

    const gridSize = flowStore.flowState.editorSettings.gridSize;
    if (flowStore.flowState.editorSettings.snapToGrid && gridSize) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    flowStore.updateNodePosition(draggingNodeId.value, { x: newX, y: newY });
  };

  const onNodeMouseUp = () => {
    if (draggingNodeId.value) {
      flowStore.finalizeNodeInteraction(draggingNodeId.value);
    }
    draggingNodeId.value = null;
    document.removeEventListener('mousemove', onNodeMouseMove);
    document.removeEventListener('mouseup', onNodeMouseUp);
  };

  const onNodeMouseDown = (event: MouseEvent, nodeId: string) => {
    if (isDrawingEdge.value && drawingEdgeSource.value?.nodeId !== nodeId) {
      // Allow completing edge on this node (handled by handleDrawingEdgeMouseUp)
    } else if (isDrawingEdge.value) {
      // If clicking on the source node of the edge being drawn, do nothing here.
      return; 
    }

    selectNode(nodeId);
    const node = flowStore.nodes.find(n => n.id === nodeId);
    if (!node || !canvasWrapperRef.value) return;

    draggingNodeId.value = nodeId;
    const canvasRect = canvasWrapperRef.value.getBoundingClientRect();
    
    dragOffset.value = {
      x: event.clientX - canvasRect.left - (node.position.x * flowStore.flowState.viewport.zoom + flowStore.flowState.viewport.x),
      y: event.clientY - canvasRect.top - (node.position.y * flowStore.flowState.viewport.zoom + flowStore.flowState.viewport.y),
    };

    document.addEventListener('mousemove', onNodeMouseMove);
    document.addEventListener('mouseup', onNodeMouseUp);
  };

  const resetDrawingState = () => {
    isDrawingEdge.value = false;
    drawingEdgeSource.value = null;
    drawingEdgePreviewLine.value = null;
  };

  const handleDrawingEdgeMouseMove = (event: MouseEvent) => {
    if (!isDrawingEdge.value || !canvasWrapperRef.value || !drawingEdgePreviewLine.value) return;
    event.preventDefault();

    const canvasWrapperRect = canvasWrapperRef.value.getBoundingClientRect();
    const endX = (event.clientX - canvasWrapperRect.left - flowStore.flowState.viewport.x) / flowStore.flowState.viewport.zoom;
    const endY = (event.clientY - canvasWrapperRect.top - flowStore.flowState.viewport.y) / flowStore.flowState.viewport.zoom;

    drawingEdgePreviewLine.value.x2 = endX;
    drawingEdgePreviewLine.value.y2 = endY;
  };

  const handleDrawingEdgeMouseUp = (event: MouseEvent) => {
    if (!isDrawingEdge.value || !drawingEdgeSource.value) {
      resetDrawingState();
      return;
    }
    
    document.removeEventListener('mousemove', handleDrawingEdgeMouseMove);

    const targetElement = event.target as HTMLElement;
    // Try to find an input point first
    const inputPointElement = targetElement.closest('.input-point') as HTMLElement | null;
    const targetNodeDiv = targetElement.closest('.flow-node') as HTMLElement | null;

    if (targetNodeDiv) {
      const targetNodeId = targetNodeDiv.dataset.nodeId;
      const targetNodeInstance = flowStore.nodes.find(n => n.id === targetNodeId);

      if (targetNodeInstance && targetNodeId && targetNodeId !== drawingEdgeSource.value.nodeId) {
        const targetNodeDef = flowStore.nodeRegistry[targetNodeInstance.type];
        let targetInputId: string | undefined = undefined;

        if (inputPointElement && inputPointElement.dataset.inputId) {
          // Check if the input point belongs to the target node
          if (targetNodeDiv.contains(inputPointElement)) {
            targetInputId = inputPointElement.dataset.inputId;
          }
        }
        
        // Fallback if no specific input point was targeted or if it wasn't on the target node
        if (!targetInputId) {
          if (targetNodeDef?.inputs && targetNodeDef.inputs.length > 0) {
            // Default to the first input if the drop was on the node but not a specific input point
            targetInputId = targetNodeDef.inputs[0].id;
          } else {
            targetInputId = 'input_default'; // Further fallback
          }
        }
        
        if (targetInputId) {
          const edgeData = {
            sourceNodeId: drawingEdgeSource.value.nodeId,
            sourceOutputId: drawingEdgeSource.value.outputId,
            targetNodeId: targetNodeId,
            targetInputId: targetInputId, 
          };
          flowStore.addEdge(edgeData);
        } else {
          console.warn('Could not determine a valid target input for the edge.');
        }
      }
    }
    resetDrawingState();
  };
  
  const onActionPointMouseDown = (event: MouseEvent, nodeId: string, outputId: string) => {
    event.stopPropagation(); // Prevent node selection/drag
    const sourceNode = flowStore.nodes.find(n => n.id === nodeId);
    if (!sourceNode || !canvasWrapperRef.value) return;

    isDrawingEdge.value = true;
    drawingEdgeSource.value = { nodeId, outputId }; // Changed from actionId

    const actionPointElement = event.target as HTMLElement;
    const actionPointRect = actionPointElement.getBoundingClientRect();
    const canvasWrapperRect = canvasWrapperRef.value.getBoundingClientRect();
    
    const startX = (actionPointRect.left + actionPointRect.width / 2 - canvasWrapperRect.left - flowStore.flowState.viewport.x) / flowStore.flowState.viewport.zoom;
    const startY = (actionPointRect.top + actionPointRect.height / 2 - canvasWrapperRect.top - flowStore.flowState.viewport.y) / flowStore.flowState.viewport.zoom;

    drawingEdgePreviewLine.value = { x1: startX, y1: startY, x2: startX, y2: startY };
    
    document.addEventListener('mousemove', handleDrawingEdgeMouseMove);
    document.addEventListener('mouseup', handleDrawingEdgeMouseUp, { once: true });
  };

  return {
    selectNode,
    onNodeMouseDown,
    onActionPointMouseDown,
    // The following are not directly returned as they are event handlers for document
    // or internal helpers, but their effects (like modifying refs passed in) are the "output"
    // onNodeMouseMove, (handled by onNodeMouseDown)
    // onNodeMouseUp, (handled by onNodeMouseDown)
    // handleDrawingEdgeMouseMove, (handled by onActionPointMouseDown)
    // handleDrawingEdgeMouseUp, (handled by onActionPointMouseDown)
    // resetDrawingState (internal)
  };
}
