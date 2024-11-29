import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CodeEditor from './CodeEditor';

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: string;
  blockLabel: string;
  onSave: (newTemplate: string) => void;
}

export default function EditTemplateModal({ 
  isOpen, 
  onClose, 
  template, 
  blockLabel,
  onSave 
}: EditTemplateModalProps) {
  const [editingTemplate, setEditingTemplate] = useState(template);

  // Update editingTemplate when template prop changes
  useEffect(() => {
    setEditingTemplate(template);
  }, [template]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editingTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">
            Edit {blockLabel} Template
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="h-96">
            <CodeEditor
              code={editingTemplate}
              onChange={setEditingTemplate}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
