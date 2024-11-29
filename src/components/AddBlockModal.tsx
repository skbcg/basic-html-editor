import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CodeEditor from './CodeEditor';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (block: { label: string; template: string; icon: string }) => void;
}

const DEFAULT_TEMPLATE = '<div style="padding: 20px;">New Block Content</div>';

export default function AddBlockModal({ isOpen, onClose, onAdd }: AddBlockModalProps) {
  const [label, setLabel] = useState('');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [selectedIcon, setSelectedIcon] = useState('Type');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setLabel('');
      setTemplate(DEFAULT_TEMPLATE);
      setSelectedIcon('Type');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onAdd({
        label: label.trim(),
        template: template.trim(),
        icon: selectedIcon
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add block');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Add New Block</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700">
                Block Label
              </label>
              <input
                type="text"
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                placeholder="Enter block label"
              />
            </div>
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700">
                Icon
              </label>
              <select
                id="icon"
                value={selectedIcon}
                onChange={(e) => setSelectedIcon(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="Type">Text</option>
                <option value="Image">Image</option>
                <option value="Link2">Link</option>
                <option value="Layout">Layout</option>
                <option value="Square">Container</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                HTML Template
              </label>
              <div className="mt-1 border border-gray-300 rounded-md" style={{ height: '300px' }}>
                <CodeEditor
                  code={template}
                  onChange={setTemplate}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
