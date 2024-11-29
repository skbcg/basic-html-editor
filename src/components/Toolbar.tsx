import { useState, useEffect } from 'react';
import { Block, fetchBlocks, getIconComponent } from '../lib/blockService';
import { DragEvent } from 'react';

interface ToolbarProps {
  onDragStart: (template: string) => void;
}

export default function Toolbar({ onDragStart }: ToolbarProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const fetchedBlocks = await fetchBlocks();
      setBlocks(fetchedBlocks);
    } catch (error) {
      console.error('Error loading blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, template: string) => {
    e.dataTransfer.setData('text/plain', template);
    onDragStart(template);
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        Loading blocks...
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Content Blocks</h2>
        <div className="space-y-2">
          {blocks.map((block, index) => {
            const IconComponent = getIconComponent(block.icon);
            return (
              <div
                key={block.id || index}
                draggable
                onDragStart={(e) => handleDragStart(e, block.template)}
                className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <IconComponent className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{block.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
