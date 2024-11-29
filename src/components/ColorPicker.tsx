import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-md border border-gray-300 shadow-sm"
        style={{ backgroundColor: color }}
      />

      {isOpen && (
        <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
          <div className="space-y-2">
            <input
              type="color"
              value={color}
              onChange={(e) => {
                const newColor = e.target.value;
                setInputValue(newColor);
                onChange(newColor);
              }}
              className="block w-8 h-8"
            />
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="#000000"
              className="block w-20 px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );
}