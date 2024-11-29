import { useCallback, useState, useRef, useEffect } from 'react';
import ContentEditable from 'react-contenteditable';
import { Copy, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import Modal from './Modal';

interface LivePreviewProps {
  html: string;
  onChange: (html: string) => void;
  isEditMode: boolean;
}

interface EditableElement {
  type: 'link' | 'image';
  text?: string;
  href?: string;
  src?: string;
  alt?: string;
  element: HTMLElement;
}

export default function LivePreview({ html, onChange, isEditMode }: LivePreviewProps) {
  const [editingElement, setEditingElement] = useState<EditableElement | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<HTMLElement | null>(null);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const [dragOverElement, setDragOverElement] = useState<HTMLElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback((evt: { target: { value: string } }) => {
    onChange(evt.target.value);
  }, [onChange]);

  const handleElementClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Handle link editing without edit mode
    if (target.tagName === 'A' && !isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      setEditingElement({
        type: 'link',
        text: target.textContent || '',
        href: target.getAttribute('href') || '',
        element: target
      });
      return;
    }
    
    // Handle image editing without edit mode
    if (target.tagName === 'IMG' && !isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      setEditingElement({
        type: 'image',
        src: target.getAttribute('src') || '',
        alt: target.getAttribute('alt') || '',
        element: target
      });
      return;
    }

    // Allow text editing in non-edit mode
    if (!isEditMode) {
      const textElement = target.closest('p, h1, h2, h3, h4, h5, h6, span, td, th');
      if (textElement instanceof HTMLElement) {
        makeEditable(textElement);
        return;
      }
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    // Get the actual clicked element
    let clickedElement = target;
    
    // Find the closest block-level element
    const blockElements = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'ASIDE', 'NAV'];
    
    // Special handling for tables - find the nearest table ancestor from the click point
    if (target.tagName === 'TABLE') {
      clickedElement = target;
    } else {
      const nearestTable = target.closest('table');
      if (nearestTable) {
        // Check if we clicked directly on a child table element
        const parentTables = target.parentElement?.closest('table');
        if (parentTables === nearestTable) {
          clickedElement = nearestTable;
        } else {
          clickedElement = target;
        }
      } else {
        // Regular block element handling
        while (clickedElement.parentElement && 
               !blockElements.includes(clickedElement.tagName) && 
               !clickedElement.parentElement.classList.contains('preview-content')) {
          clickedElement = clickedElement.parentElement;
        }
      }
    }
    
    // Don't select the preview-content itself
    if (clickedElement.classList.contains('preview-content') || 
        clickedElement === previewRef.current) {
      return;
    }

    // Clear previous selection
    document.querySelectorAll('.block-selected').forEach(el => {
      el.classList.remove('block-selected');
      el.setAttribute('draggable', 'false');
    });

    // Select the clicked element and make it draggable
    clickedElement.classList.add('block-selected');
    clickedElement.setAttribute('draggable', 'true');
    setSelectedBlock(clickedElement);
  };

  const moveBlock = (direction: 'up' | 'down') => {
    if (!selectedBlock || !selectedBlock.parentElement) return;

    const parent = selectedBlock.parentElement;
    const blocks = Array.from(parent.children);
    const currentIndex = blocks.indexOf(selectedBlock);
    
    if (direction === 'up' && currentIndex > 0) {
      parent.insertBefore(selectedBlock, blocks[currentIndex - 1]);
    } else if (direction === 'down' && currentIndex < blocks.length - 1) {
      parent.insertBefore(blocks[currentIndex + 1], selectedBlock);
    }
    
    onChange(previewRef.current?.innerHTML || '');
  };

  const duplicateBlock = () => {
    if (selectedBlock && previewRef.current) {
      const clone = selectedBlock.cloneNode(true) as HTMLElement;
      selectedBlock.parentElement?.insertBefore(clone, selectedBlock.nextSibling);
      onChange(previewRef.current.innerHTML);
    }
  };

  const deleteBlock = () => {
    if (selectedBlock && previewRef.current) {
      selectedBlock.remove();
      setSelectedBlock(null);
      onChange(previewRef.current.innerHTML);
    }
  };

  const updateElement = (updates: Partial<EditableElement>) => {
    if (!editingElement) return;

    const element = editingElement.element;
    if (editingElement.type === 'link') {
      element.textContent = updates.text || '';
      element.setAttribute('href', updates.href || '#');
    } else if (editingElement.type === 'image') {
      element.setAttribute('src', updates.src || '');
      element.setAttribute('alt', updates.alt || '');
    }

    if (previewRef.current) {
      onChange(previewRef.current.innerHTML);
    }
    setEditingElement(null);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;
    
    if (target.classList.contains('preview-content')) {
      e.preventDefault();
      return;
    }

    setDraggedElement(target);
    target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    // For Firefox
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const target = e.target as HTMLElement;
    if (draggedElement && (target === draggedElement || target.classList.contains('preview-content'))) return;
    
    // Clear previous drag-over states
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });

    if (!target.classList.contains('preview-content')) {
      target.classList.add('drag-over');
      setDragOverElement(target);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditMode || !previewRef.current) return;

    const target = e.target as HTMLElement;
    target.classList.remove('drag-over');

    // Get the drop target (the element we're dropping onto or next to)
    let dropTarget = target;
    if (dropTarget.classList.contains('preview-content')) {
      // If dropping on the main container, append to the end
      dropTarget = previewRef.current;
    }

    // Handle dropping a new block from toolbar
    const template = e.dataTransfer.getData('text/plain');
    if (template && template.trim().startsWith('<')) {
      // Create temporary div to parse HTML template
      const temp = document.createElement('div');
      temp.innerHTML = template;
      const newElement = temp.firstElementChild as HTMLElement;
      
      if (newElement) {
        // Insert the new element
        if (dropTarget === previewRef.current) {
          // Append to the end if dropping on the container
          dropTarget.appendChild(newElement);
        } else {
          // Insert before or after the target based on drop position
          const rect = dropTarget.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          
          if (e.clientY < midY) {
            dropTarget.parentElement?.insertBefore(newElement, dropTarget);
          } else {
            dropTarget.parentElement?.insertBefore(newElement, dropTarget.nextSibling);
          }
        }
      }
    } 
    // Handle moving existing blocks
    else if (draggedElement) {
      // Don't drop on itself or its children
      if (dropTarget === draggedElement || draggedElement.contains(dropTarget)) {
        return;
      }

      // Insert before or after the target based on drop position
      if (dropTarget !== previewRef.current) {
        const rect = dropTarget.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        if (e.clientY < midY) {
          dropTarget.parentElement?.insertBefore(draggedElement, dropTarget);
        } else {
          dropTarget.parentElement?.insertBefore(draggedElement, dropTarget.nextSibling);
        }
      } else {
        // Append to the end if dropping on the container
        dropTarget.appendChild(draggedElement);
      }
    }

    // Cleanup
    if (draggedElement) {
      draggedElement.classList.remove('dragging');
    }
    setDraggedElement(null);
    setDragOverElement(null);
    
    // Update the HTML content
    onChange(previewRef.current.innerHTML);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove('drag-over');
    setDragOverElement(null);
  };

  const handleDragEnd = () => {
    if (draggedElement) {
      draggedElement.classList.remove('dragging');
    }
    if (dragOverElement) {
      dragOverElement.classList.remove('drag-over');
    }
    setDraggedElement(null);
    setDragOverElement(null);
  };

  const handleTextEdit = (e: Event) => {
    if (!previewRef.current) return;

    const target = e.target as HTMLElement;
    if (!target.isContentEditable) return;

    // Store current selection and cursor position
    const selection = window.getSelection();
    let cursorNode = selection?.focusNode || null;
    let cursorOffset = selection?.focusOffset || 0;

    // Remove all contenteditable attributes before getting HTML
    const editableElements = previewRef.current.querySelectorAll('[contenteditable]');
    editableElements.forEach(el => {
      el.removeAttribute('contenteditable');
    });

    // Get the current HTML content without contenteditable attributes
    const updatedHtml = previewRef.current.innerHTML;
    
    // Restore contenteditable on the active element
    target.setAttribute('contenteditable', 'true');
    
    // Only update if content changed to prevent unnecessary re-renders
    if (updatedHtml !== html) {
      onChange(updatedHtml);
      
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        if (cursorNode && cursorNode.parentElement) {
          // Find the corresponding element in the new DOM
          const newElement = previewRef.current?.querySelector(`[data-id="${cursorNode.parentElement.getAttribute('data-id')}"]`);
          if (newElement) {
            // Make sure it's still editable
            newElement.setAttribute('contenteditable', 'true');
            
            // Restore cursor position
            const range = document.createRange();
            const textNode = newElement.firstChild || newElement;
            range.setStart(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0));
            range.collapse(true);
            
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }
      });
    }
  };

  const makeEditable = (element: HTMLElement) => {
    if (!element) return;
    
    // Ensure element has a data-id
    if (!element.hasAttribute('data-id')) {
      element.setAttribute('data-id', `text-element-${Date.now()}`);
    }
    
    // Remove contenteditable from all other elements
    if (previewRef.current) {
      previewRef.current.querySelectorAll('[contenteditable="true"]').forEach(el => {
        if (el !== element) {
          el.removeAttribute('contenteditable');
        }
      });
    }

    element.setAttribute('contenteditable', 'true');
    element.focus();
  };

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const handleInput = (e: Event) => handleTextEdit(e);
    
    // Listen for both input and blur events
    preview.addEventListener('input', handleInput);
    preview.addEventListener('blur', handleInput, true);

    return () => {
      preview.removeEventListener('input', handleInput);
      preview.removeEventListener('blur', handleInput, true);
    };
  }, [html, onChange]);

  useEffect(() => {
    const handleInput = (e: Event) => {
      handleTextEdit(e);
    };

    if (previewRef.current && isEditMode) {
      previewRef.current.addEventListener('input', handleInput);
      return () => {
        previewRef.current?.removeEventListener('input', handleInput);
      };
    }
  }, [isEditMode]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === previewRef.current) return;

      if (!isEditMode) {
        // Handle link editing without edit mode
        if (target.tagName === 'A') {
          e.preventDefault();
          e.stopPropagation();
          setEditingElement({
            type: 'link',
            text: target.textContent || '',
            href: target.getAttribute('href') || '',
            element: target
          });
          return;
        }
        
        // Handle image editing without edit mode
        if (target.tagName === 'IMG') {
          e.preventDefault();
          e.stopPropagation();
          setEditingElement({
            type: 'image',
            src: target.getAttribute('src') || '',
            alt: target.getAttribute('alt') || '',
            element: target
          });
          return;
        }
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      // Find the closest element that's a direct child of preview-content
      let element = target;
      while (element.parentElement && !element.parentElement.classList.contains('preview-content')) {
        element = element.parentElement;
      }

      if (element.parentElement?.classList.contains('preview-content')) {
        e.preventDefault();
        e.stopPropagation();

        // Clear previous selection
        document.querySelectorAll('.block-selected').forEach(el => {
          el.classList.remove('block-selected');
        });

        // Select the element
        element.classList.add('block-selected');
        element.setAttribute('draggable', 'true');
        setSelectedBlock(element);
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === previewRef.current || !isEditMode) {
        e.preventDefault();
        return;
      }

      setDraggedElement(target);
      target.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', '');
    };

    previewRef.current?.addEventListener('click', handleClick);
    previewRef.current?.addEventListener('dragstart', handleDragStart);

    return () => {
      previewRef.current?.removeEventListener('click', handleClick);
      previewRef.current?.removeEventListener('dragstart', handleDragStart);
    };
  }, [isEditMode, onChange]);

  return (
    <div className={`h-full bg-white shadow-inner overflow-auto relative ${isEditMode ? 'edit-mode' : ''}`}>
      {isEditMode && selectedBlock && (
        <div className="fixed bottom-4 right-4 flex gap-2 bg-white p-2 rounded-lg shadow-lg z-50">
          <button
            onClick={() => moveBlock('up')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Move Up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => moveBlock('down')}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Move Down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            onClick={duplicateBlock}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={deleteBlock}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="max-w-[600px] mx-auto p-8">
        <div
          ref={previewRef}
          className="preview-content outline-none min-h-[calc(100vh-4rem)]"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleElementClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <Modal
        isOpen={!!editingElement}
        onClose={() => setEditingElement(null)}
        title={editingElement?.type === 'link' ? 'Edit Link' : 'Edit Image'}
      >
        {editingElement?.type === 'link' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text
              </label>
              <input
                type="text"
                value={editingElement.text}
                onChange={(e) => setEditingElement({ ...editingElement, text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="text"
                value={editingElement.href}
                onChange={(e) => setEditingElement({ ...editingElement, href: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingElement(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateElement({ text: editingElement.text, href: editingElement.href })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        )}
        {editingElement?.type === 'image' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={editingElement.src}
                onChange={(e) => setEditingElement({ ...editingElement, src: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={editingElement.alt}
                onChange={(e) => setEditingElement({ ...editingElement, alt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingElement(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateElement({ src: editingElement.src, alt: editingElement.alt })}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}