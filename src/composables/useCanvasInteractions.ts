import { onMounted, onUnmounted, type Ref } from 'vue';
import { useFlowStore } from '@/stores/flow';

export function useCanvasInteractions(
  canvasWrapperRef: Ref<HTMLElement | null>,
  canvasRef: Ref<HTMLElement | null>,
  isDrawingEdge: Ref<boolean> // To prevent panning while drawing an edge - may not be needed for wheel based pan/zoom
) {
  const store = useFlowStore();

  // Drag and Drop from Palette
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    if (!canvasWrapperRef.value) return;

    const nodeType = event.dataTransfer?.getData('application/pocketflow-nodetype');
    if (nodeType) {
      const rect = canvasWrapperRef.value.getBoundingClientRect();
      // Calculate position relative to the canvas, considering viewport pan and zoom
      let x = (event.clientX - rect.left - store.flowState.viewport.x) / store.flowState.viewport.zoom;
      let y = (event.clientY - rect.top - store.flowState.viewport.y) / store.flowState.viewport.zoom;

      const gridSize = store.flowState.editorSettings.gridSize;
      if (store.flowState.editorSettings.snapToGrid && gridSize && gridSize > 0) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }

      const newNode = store.addNode(nodeType, { x, y });
      if (newNode && newNode.id) {
        store.setSelectedNode(newNode.id);
      }
    }
  };

  // Zooming and Panning via Wheel
  const handleWheel = (e: WheelEvent) => {
    if (!canvasWrapperRef.value) return;
    e.preventDefault();

    // If isDrawingEdge is true, perhaps we don't want to pan/zoom.
    // However, Figma allows this, so let's allow it for now.
    // if (isDrawingEdge.value) return;

    if (e.ctrlKey) { // Zooming (typically pinch gesture or Ctrl + mouse wheel)
      const zoomSpeed = 0.05;
      const currentZoom = store.flowState.viewport.zoom;
      const rect = canvasWrapperRef.value.getBoundingClientRect();

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -Math.sign(e.deltaY) * zoomSpeed * currentZoom;
      let newZoom = currentZoom + delta;
      
      newZoom = Math.max(0.2, Math.min(newZoom, 3)); 

      const oldCanvasX = (mouseX - store.flowState.viewport.x) / currentZoom;
      const oldCanvasY = (mouseY - store.flowState.viewport.y) / currentZoom;

      store.flowState.viewport.x = mouseX - oldCanvasX * newZoom;
      store.flowState.viewport.y = mouseY - oldCanvasY * newZoom;
      store.flowState.viewport.zoom = newZoom;
    } else { // Panning (typically two-finger scroll on trackpad or shift + mouse wheel)
      // deltaX and deltaY from wheel events are scroll amounts.
      // Positive deltaX: scroll right -> canvas moves left (viewport.x decreases)
      // Positive deltaY: scroll down -> canvas moves up (viewport.y decreases)
      store.flowState.viewport.x -= e.deltaX;
      store.flowState.viewport.y -= e.deltaY;
    }
  };
  
  const setupEventListeners = () => {
    const wrapper = canvasWrapperRef.value;
    if (!wrapper) return;

    // Drag and Drop (These are returned to be bound in template)
    // wrapper.addEventListener('dragover', handleDragOver);
    // wrapper.addEventListener('drop', handleDrop);

    // Zooming and Panning
    wrapper.addEventListener('wheel', handleWheel, { passive: false }); // passive: false to allow preventDefault
  };

  const removeEventListeners = () => {
    const wrapper = canvasWrapperRef.value;
    if (!wrapper) return;

    // wrapper.removeEventListener('dragover', handleDragOver);
    // wrapper.removeEventListener('drop', handleDrop);
    // wrapper.removeEventListener('mousedown', onMouseDownPan);
    // document.removeEventListener('mousemove', onMouseMovePan);
    // document.removeEventListener('mouseup', onMouseUpPan);
    wrapper.removeEventListener('wheel', handleWheel);
  };

  onMounted(setupEventListeners);
  onUnmounted(removeEventListeners);

  return {
    handleDragOver, // Expose for template binding
    handleDrop,     // Expose for template binding
  };
}
