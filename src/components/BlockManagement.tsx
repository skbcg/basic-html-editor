import React, { useState, useEffect } from 'react';
import { Plus, PenSquare, Trash2, Code, Layout, Type, Image, Link, List, Video, Table, Grid, Box, Circle, Square, Triangle, Building2, User2, X } from 'lucide-react';
import CodeEditor from './CodeEditor';
import { Block, fetchBlocks, addBlock, updateBlock, deleteBlock, getIconComponent } from '../lib/blockService';
import { useUser } from '../contexts/UserContext';

export default function BlockManagement() {
  const { userProfile } = useUser();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Partial<Block>>({
    label: '',
    template: '',
    icon: 'Code',
    createdBy: userProfile?.uid || '',
    isGlobal: false
  });

  const iconOptions = [
    'Code', 'Layout', 'Type', 'Image', 'Link', 'List',
    'Video', 'Table', 'Grid', 'Box', 'Circle', 'Square', 'Triangle'
  ];

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

  const handleEdit = (block: Block) => {
    setSelectedBlock(block);
    setEditingBlock({
      ...block
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setSelectedBlock(null);
    setEditingBlock({
      label: '',
      template: '',
      icon: 'Code',
      createdBy: userProfile?.uid || '',
      isGlobal: false
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!editingBlock.label || !editingBlock.template || !userProfile?.uid) {
        alert('Please fill in all required fields');
        return;
      }

      // Check admin status before trying to save global block
      const isAdmin = userProfile.role === 'admin';
      if (editingBlock.isGlobal && !isAdmin) {
        alert('Only admins can create or modify global blocks');
        return;
      }

      const blockData = {
        label: editingBlock.label,
        template: editingBlock.template,
        icon: editingBlock.icon || 'Code',
        createdBy: userProfile.uid,
        isGlobal: !!editingBlock.isGlobal
      };

      if (selectedBlock) {
        await updateBlock(selectedBlock.id!, blockData, isAdmin);
      } else {
        await addBlock(blockData, isAdmin);
      }

      await loadBlocks();
      setIsEditing(false);
      setSelectedBlock(null);
      setEditingBlock({
        label: '',
        template: '',
        icon: 'Code',
        createdBy: userProfile.uid,
        isGlobal: false
      });
    } catch (error: any) {
      console.error('Error saving block:', error);
      let errorMessage = 'Failed to save block. ';
      
      if (error.message.includes('Only admins')) {
        errorMessage += 'You need admin privileges to modify this block.';
      } else if (error.message.includes('must be logged in')) {
        errorMessage += 'Please log in to continue.';
      } else if (error.message.includes('own blocks')) {
        errorMessage += 'You can only modify your own blocks.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  const handleDelete = async (block: Block) => {
    if (window.confirm('Are you sure you want to delete this block?')) {
      try {
        if (!userProfile?.uid) {
          alert('Please log in to delete blocks');
          return;
        }

        const isAdmin = userProfile.role === 'admin';
        await deleteBlock(block.id!, isAdmin);
        await loadBlocks();
      } catch (error: any) {
        console.error('Error deleting block:', error);
        let errorMessage = 'Failed to delete block. ';
        
        if (error.message.includes('Only admins')) {
          errorMessage += 'You need admin privileges to delete this block.';
        } else if (error.message.includes('own blocks')) {
          errorMessage += 'You can only delete your own blocks.';
        } else {
          errorMessage += 'Please try again.';
        }
        
        alert(errorMessage);
      }
    }
  };

  const canEdit = (block: Block) => {
    return userProfile?.role === 'admin' || block.createdBy === userProfile?.uid;
  };

  if (loading) {
    return <div className="p-6">Loading blocks...</div>;
  }

  return (
    <div className="relative h-full flex">
      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Block Manager</h1>
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Block
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-all"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="scope-icon" style={{ color: '#888', marginRight: '8px' }}>
                      {block.isGlobal ? <Building2 size={16} /> : <User2 size={16} />}
                    </span>
                    {React.createElement(getIconComponent(block.icon), { 
                      className: "w-5 h-5 text-gray-500" 
                    })}
                    <h3 className="text-sm font-medium text-gray-900">{block.label}</h3>
                  </div>
                  {canEdit(block) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(block)}
                        className="p-1 text-gray-400 hover:text-gray-500"
                      >
                        <PenSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(block)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sliding panel */}
      <div
        className={`fixed inset-y-0 right-0 w-2/3 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isEditing ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {isEditing && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">
                {selectedBlock ? 'Edit Block' : 'Create New Block'}
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Label</label>
                <input
                  type="text"
                  value={editingBlock.label}
                  onChange={(e) => setEditingBlock({ ...editingBlock, label: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Icon</label>
                <select
                  value={editingBlock.icon}
                  onChange={(e) => setEditingBlock({ ...editingBlock, icon: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              {userProfile?.role === 'admin' && (
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={editingBlock.isGlobal}
                      onChange={(e) => setEditingBlock(prev => ({ ...prev, isGlobal: e.target.checked }))}
                    />
                    Make this block available to all users
                  </label>
                </div>
              )}

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <div className="h-[500px] border rounded-md">
                  <CodeEditor
                    code={editingBlock.template || ''}
                    onChange={(code) => setEditingBlock({ ...editingBlock, template: code })}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Block
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
