import { Type, Image, Link2, Layout, Square } from 'lucide-react';
import { useState } from 'react';
import { Block } from '../../lib/blockService';
import ContentBlock from './ContentBlock';

interface ToolbarProps {
  onDragStart: (template: string) => void;
  onDeleteBlock?: (id: string) => void;
  blocks: Block[];
}

const defaultBlocks: Block[] = [
  {
    id: 'heading',
    icon: Type,
    label: 'Heading',
    template: `<h2 style="color: #333; font-size: 24px; margin: 20px 0;">New Heading</h2>`,
  },
  {
    id: 'paragraph',
    icon: Type,
    label: 'Paragraph',
    template: `<p style="color: #666; line-height: 1.6; margin: 16px 0;">Enter your text here...</p>`,
  },
  {
    id: 'button',
    icon: Square,
    label: 'Button',
    template: `<a href="#" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0;">Click Me</a>`,
  },
  {
    id: 'image',
    icon: Image,
    label: 'Image',
    template: `<img src="https://images.unsplash.com/photo-1526280760714-f9e8b26f318f?w=600" alt="Placeholder" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />`,
  },
  {
    id: 'container',
    icon: Layout,
    label: 'Container',
    template: `<div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="color: #444; margin-bottom: 10px;">Container Title</h3>
  <p style="color: #666;">Add your content here...</p>
</div>`,
  },
  {
    id: 'link',
    icon: Link2,
    label: 'Link',
    template: `<a href="#" style="color: #007bff; text-decoration: underline;">Link Text</a>`,
  },
];

export default function Toolbar({ onDragStart, onDeleteBlock, blocks = defaultBlocks }: ToolbarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-500 mb-4">Content Blocks</h2>
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <ContentBlock
            key={block.id || index}
            id={block.id}
            icon={block.icon}
            label={block.label}
            template={block.template}
            onDragStart={onDragStart}
            onDelete={onDeleteBlock}
          />
        ))}
      </div>
    </div>
  );
}