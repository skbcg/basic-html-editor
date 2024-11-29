import { useState, useEffect } from 'react';
import { Split, Mail, Edit2, Settings, Plus, Users, Layout, ArrowLeft } from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import LivePreview from './components/LivePreview';
import Toolbar from './components/Toolbar';
import EditTemplateModal from './components/EditTemplateModal';
import AddBlockModal from './components/AddBlockModal';
import UserAvatar from './components/UserAvatar';
import UserManagement from './components/UserManagement';
import BlockManagement from './components/BlockManagement';
import GlobalSettings from './components/GlobalSettings';
import { UserProvider, useUser } from './contexts/UserContext';
import { fetchBlocks, addBlock, updateBlock, deleteBlock, getIconComponent, Block } from './lib/blockService';

const defaultTemplate = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">Welcome to Our Newsletter</h1>
  <img src="https://images.unsplash.com/photo-1526280760714-f9e8b26f318f?w=600" alt="Email Header" style="width: 100%; height: auto; border-radius: 8px;" />
  <p style="color: #666; line-height: 1.6;">
    Hello there! We're excited to share our latest updates with you.
  </p>
  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="color: #444;">Featured Article</h2>
    <p style="color: #666;">
      Check out our latest blog post about email marketing best practices.
    </p>
    <a href="#" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
      Read More
    </a>
  </div>
  <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 14px;">
    2024 Your Company. All rights reserved.
  </footer>
</div>`;

function AppContent() {
  const { user, userProfile, loading } = useUser();
  const [html, setHtml] = useState(defaultTemplate);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminView, setAdminView] = useState<'users' | 'blocks'>('users');
  const [dragTemplate, setDragTemplate] = useState<string>('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editingBlock, setEditingBlock] = useState<{ index: number; template: string; label: string } | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [showBlockTooltip, setShowBlockTooltip] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      const loadedBlocks = await fetchBlocks();
      setBlocks(loadedBlocks);
    } catch (error) {
      console.error('Error loading blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleUpdateBlock = async (index: number, newTemplate: string) => {
    const block = blocks[index];
    if (!block.id) return;

    try {
      await updateBlock(block.id, { template: newTemplate });
      const newBlocks = [...blocks];
      newBlocks[index] = { ...newBlocks[index], template: newTemplate };
      setBlocks(newBlocks);
    } catch (error) {
      console.error('Error updating block:', error);
    }
  };

  const handleAddBlock = async (newBlock: { label: string; template: string; icon: string }) => {
    try {
      setLoadingBlocks(true);
      const addedBlock = await addBlock(newBlock);
      if (!addedBlock) {
        throw new Error('Failed to add block');
      }
      await loadBlocks(); // Reload all blocks to ensure we have the latest data
      setIsAddingBlock(false);
    } catch (error) {
      console.error('Error adding block:', error);
      throw error; // Propagate error to modal for display
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      setLoadingBlocks(true);
      await deleteBlock(id);
      await loadBlocks(); // Reload blocks after deletion
    } catch (error) {
      console.error('Error deleting block:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleDragStart = (template: string) => {
    setDragTemplate(template);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragTemplate) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const node = document.createTextNode(dragTemplate);
        range.insertNode(node);
        range.collapse(false);
      } else {
        setHtml(prev => prev + dragTemplate);
      }
      setDragTemplate('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <nav className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        {!isAdminMode ? (
          <>
            <div className="flex items-center">
              <div className="relative inline-block">
                <button
                  onClick={() => user ? (setIsAdminMode(true), setAdminView('blocks')) : null}
                  onMouseEnter={() => {
                    if (!user) {
                      setShowBlockTooltip(true);
                    }
                  }}
                  onMouseLeave={() => setShowBlockTooltip(false)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
                    user 
                      ? 'hover:bg-gray-100 text-gray-700' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Edit2 className="w-4 h-4 mr-2 text-gray-500" />
                  Block Manager
                </button>
                {showBlockTooltip && !user && (
                  <div 
                    className="absolute left-0 top-full mt-2 px-4 py-2 text-sm bg-gray-800 text-white rounded-md shadow-lg whitespace-nowrap z-[100] min-w-max"
                    style={{ 
                      pointerEvents: 'none',
                      transform: 'translateY(2px)',
                      maxWidth: '90vw',
                      animation: 'fadeIn 0.2s ease-in-out'
                    }}
                  >
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45" />
                    Sign in to manage and create your own blocks
                  </div>
                )}
              </div>

            
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-center rounded-lg bg-gray-100 p-1">

                   <button
                onClick={() => setIsGlobalSettingsOpen(true)}
                className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 text-gray-700 hover:bg-gray-200"
              >
                <Settings className="w-4 h-4 mr-2 text-gray-500" />
                Global Settings
              </button>

                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isEditMode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Plus className={`w-4 h-4 mr-2 ${isEditMode ? 'text-blue-500' : 'text-gray-500'}`} />
                  {isEditMode ? "Back to Preview" : "Add Blocks"}
                </button>
               
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isPreviewMode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Split className={`w-4 h-4 mr-2 ${isPreviewMode ? 'text-blue-500' : 'text-gray-500'}`} />
                  {isPreviewMode ? "Show Editor" : "Preview"}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <UserAvatar 
                user={user} 
                userProfile={userProfile}
                onManageUsers={() => {
                  setIsAdminMode(true);
                  setAdminView('users');
                }} 
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setIsAdminMode(false);
                  setIsEditMode(false);
                }}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 rounded-md hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2 text-gray-500" />
                Back to Editor
              </button>
              {userProfile?.role === 'admin' && (
                <div className="flex items-center rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={() => setAdminView('users')}
                    className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                      adminView === 'users'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Users className={`w-4 h-4 mr-2 ${adminView === 'users' ? 'text-blue-500' : 'text-gray-500'}`} />
                    Manage Users
                  </button>
                  <button
                    onClick={() => setAdminView('blocks')}
                    className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                      adminView === 'blocks'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Layout className={`w-4 h-4 mr-2 ${adminView === 'blocks' ? 'text-blue-500' : 'text-gray-500'}`} />
                    Manage Blocks
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <UserAvatar 
                user={user} 
                userProfile={userProfile}
                onManageUsers={() => {
                  setIsAdminMode(true);
                  setAdminView('users');
                }} 
              />
            </div>
          </>
        )}
      </nav>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(2px);
          }
        }
      `}</style>

      <main className="flex-1 overflow-hidden">
        {isAdminMode ? (
          adminView === 'users' ? (
            <UserManagement />
          ) : (
            <BlockManagement />
          )
        ) : (
          <div className="h-full flex">
            {/* Toolbar */}
            {isEditMode && !isPreviewMode && (
              <Toolbar onDragStart={handleDragStart} />
            )}

            {/* Code Editor */}
            <div 
              className={`${isPreviewMode ? 'hidden' : 'flex-1'} border-r border-gray-200`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <CodeEditor code={html} onChange={setHtml} />
            </div>

            {/* Preview */}
            <div className={isPreviewMode ? 'w-full' : 'flex-1'}>
              <LivePreview html={html} onChange={setHtml} isEditMode={isEditMode} />
            </div>
          </div>
        )}
      </main>

      <EditTemplateModal
        isOpen={editingBlock !== null}
        onClose={() => setEditingBlock(null)}
        template={editingBlock?.template || ''}
        blockLabel={editingBlock?.label || ''}
        onSave={(newTemplate) => {
          if (editingBlock) {
            handleUpdateBlock(editingBlock.index, newTemplate);
            setEditingBlock(null);
          }
        }}
      />

      <AddBlockModal
        isOpen={isAddingBlock}
        onClose={() => setIsAddingBlock(false)}
        onAdd={handleAddBlock}
      />

      <GlobalSettings
        isOpen={isGlobalSettingsOpen}
        onClose={() => setIsGlobalSettingsOpen(false)}
        html={html}
        onChange={setHtml}
      />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}