import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import ColorPicker from './ColorPicker';
import Modal from './Modal';

interface GlobalSettingsProps {
  html: string;
  onChange: (html: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface ColorSetting {
  name: string;
  value: string;
  description: string;
}

export default function GlobalSettings({ html, onChange, isOpen, onClose }: GlobalSettingsProps) {
  const [colors, setColors] = useState<ColorSetting[]>([]);

  useEffect(() => {
    // Extract colors from HTML when opened
    if (isOpen) {
      const colorRegex = /#[0-9A-Fa-f]{6}/g;
      const matches = html.match(colorRegex) || [];
      const uniqueColors = Array.from(new Set(matches));
      
      const colorSettings: ColorSetting[] = uniqueColors.map(color => {
        const context = getColorContext(html, color);
        return {
          name: context.name,
          value: color,
          description: context.description,
        };
      });

      setColors(colorSettings);
    }
  }, [html, isOpen]);

  const getColorContext = (html: string, color: string) => {
    const elementMap: Record<string, string> = {
      'h1': 'Heading 1',
      'h2': 'Heading 2',
      'h3': 'Heading 3',
      'p': 'Paragraph',
      'a': 'Link',
      'div': 'Container',
    };

    // Find the element that contains this color
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.querySelectorAll('*');
    let name = 'Color';
    let description = 'General color';

    for (const element of elements) {
      const style = element.getAttribute('style') || '';
      if (style.includes(color)) {
        const elementType = element.tagName.toLowerCase();
        name = elementMap[elementType] || 'Element';
        
        if (style.includes('background-color')) {
          description = `${name} Background`;
        } else if (style.includes('color')) {
          description = `${name} Text`;
        }
        break;
      }
    }

    return { name, description };
  };

  const updateColor = (oldColor: string, newColor: string) => {
    const updatedHtml = html.replace(new RegExp(oldColor, 'g'), newColor);
    onChange(updatedHtml);
    
    setColors(colors.map(color => 
      color.value === oldColor 
        ? { ...color, value: newColor }
        : color
    ));
  };

  return (
    <>
      <button
        onClick={onClose}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        <Settings className="h-4 w-4 mr-2" />
        Global Settings
      </button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Global Settings"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Colors</h3>
            <div className="space-y-4">
              {colors.map((color, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{color.description}</p>
                    <p className="text-sm text-gray-500">{color.value}</p>
                  </div>
                  <ColorPicker
                    color={color.value}
                    onChange={(newColor) => updateColor(color.value, newColor)}
                  />
                </div>
              ))}
              {colors.length === 0 && (
                <p className="text-sm text-gray-500">No colors found in the template</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}