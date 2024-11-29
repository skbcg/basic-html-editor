import { Type, Image, Link2, Layout, Square, Trash2 } from 'lucide-react';

interface ContentBlockProps {
  id?: string;
  icon: string;
  label: string;
  template: string;
  onDragStart: (template: string) => void;
  onDelete?: (id: string) => void;
}

const iconComponents = {
  Type,
  Image,
  Link2,
  Layout,
  Square,
  Mail: Type // Default to Type for Mail icon
};

export default function ContentBlock({ id, icon, label, template, onDragStart, onDelete }: ContentBlockProps) {
  const IconComponent = iconComponents[icon as keyof typeof iconComponents] || Type;
  const isCustomBlock = id && !id.startsWith('default-');

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', template);
        onDragStart(template);
      }}
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all cursor-move group"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">{label}</span>
        </div>
        {isCustomBlock && onDelete && id && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
            title="Delete block"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}