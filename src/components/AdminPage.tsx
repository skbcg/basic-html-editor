import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';
import CodeEditor from './CodeEditor';

interface Block {
  icon: any;
  label: string;
  template: string;
}

interface AdminPageProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: Block[];
  onUpdateBlock: (index: number, newTemplate: string) => void;
}

export default function AdminPage({ isOpen, onClose, blocks, onUpdateBlock }: AdminPageProps) {
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState('');

  useEffect(() => {
    if (selectedBlock !== null) {
      setEditingTemplate(blocks[selectedBlock].template);
    }
  }, [selectedBlock, blocks]);

  const handleSave = () => {
    if (selectedBlock !== null) {
      onUpdateBlock(selectedBlock, editingTemplate);
      setSelectedBlock(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Content Block Templates">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {blocks.map((block, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => setSelectedBlock(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <block.icon className="h-5 w-5 text-gray-600" />
                  <h3 className="text-sm font-medium text-gray-900">{block.label}</h3>
                </div>
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {block.template}
              </pre>
            </div>
          ))}
        </div>

        {selectedBlock !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium">
                  Edit {blocks[selectedBlock].label} Template
                </h3>
                <button
                  onClick={() => setSelectedBlock(null)}
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
                    onClick={() => setSelectedBlock(null)}
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
        )}
      </div>
    </Modal>
  );
}
