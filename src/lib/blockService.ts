import { Code, Layout, Type, Image, Link, List, Video, Table, Grid, Box, Circle, Square, Triangle } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

const COLLECTION_NAME = 'blocks';

export interface Block {
  id?: string;
  label: string;
  template: string;
  icon: string;
  createdBy: string;
  isDefault?: boolean;
  isGlobal?: boolean;
  userId?: string | null;
  createdAt?: number;
}

export const defaultBlocks = [
  {
    id: 'default-header',
    label: 'Header',
    template: '<h1 style="color: #333;">Welcome to Our Newsletter</h1>',
    icon: 'Type',
    createdBy: 'system',
    isDefault: true,
    isGlobal: false,
    userId: null,
    createdAt: Date.now()
  },
  {
    id: 'default-image',
    label: 'Image',
    template: '<img src="https://images.unsplash.com/photo-1526280760714-f9e8b26f318f?w=600" alt="Email Header" style="width: 100%; height: auto; border-radius: 8px;" />',
    icon: 'Image',
    createdBy: 'system',
    isDefault: true,
    isGlobal: false,
    userId: null,
    createdAt: Date.now()
  },
  {
    id: 'default-text',
    label: 'Text',
    template: '<p style="color: #666; line-height: 1.6;">Hello there! We\'re excited to share our latest updates with you.</p>',
    icon: 'Type',
    createdBy: 'system',
    isDefault: true,
    isGlobal: false,
    userId: null,
    createdAt: Date.now()
  },
  {
    id: 'default-cta',
    label: 'Call to Action',
    template: '<a href="#" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; text-align: center;">Learn More</a>',
    icon: 'Link',
    createdBy: 'system',
    isDefault: true,
    isGlobal: false,
    userId: null,
    createdAt: Date.now()
  }
];

const iconComponents = {
  Code,
  Layout,
  Type,
  Image,
  Link,
  List,
  Video,
  Table,
  Grid,
  Box,
  Circle,
  Square,
  Triangle
};

export const getIconComponent = (iconName: string) => {
  const IconComponent = iconComponents[iconName as keyof typeof iconComponents] || Code;
  return IconComponent;
};

// Initialize default blocks in Firestore
export const initializeDefaultBlocks = async () => {
  try {
    for (const block of defaultBlocks) {
      const blockRef = doc(db, COLLECTION_NAME, block.id);
      await setDoc(blockRef, block, { merge: true });
    }
  } catch (error) {
    console.error('Error initializing default blocks:', error);
  }
};

export const fetchBlocks = async (): Promise<Block[]> => {
  try {
    const userId = auth.currentUser?.uid;
    const blocksRef = collection(db, COLLECTION_NAME);
    const blocks: Block[] = [];

    // Get all blocks and filter in memory to avoid complex indexes
    const allBlocksSnapshot = await getDocs(blocksRef);
    
    allBlocksSnapshot.forEach((doc) => {
      const block = { id: doc.id, ...doc.data() } as Block;
      
      // Add block if it's:
      // 1. A default block
      // 2. A global block
      // 3. User's personal block
      if (block.isDefault || 
          block.isGlobal || 
          (block.createdBy === userId && !block.isDefault && !block.isGlobal)) {
        blocks.push(block);
      }
    });
    
    return blocks;
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return [];
  }
};

export const addBlock = async (
  block: Pick<Block, 'label' | 'template' | 'icon' | 'createdBy' | 'isGlobal'>,
  isAdmin: boolean
): Promise<Block> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be logged in to create blocks');
    }

    // Check if user is admin when trying to create global block
    if (block.isGlobal && !isAdmin) {
      throw new Error('Only admins can create global blocks');
    }

    const newBlock = {
      label: block.label,
      template: block.template,
      icon: block.icon,
      createdBy: userId,
      isGlobal: !!block.isGlobal,
      isDefault: false,
      userId: block.isGlobal ? null : userId,
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newBlock);
    return { id: docRef.id, ...newBlock };
  } catch (error) {
    console.error('Error adding block:', error);
    throw error;
  }
};

export const updateBlock = async (
  id: string, 
  updates: Partial<Block>,
  isAdmin: boolean
): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be logged in to update blocks');
    }

    const blockRef = doc(db, COLLECTION_NAME, id);
    const blockDoc = await getDoc(blockRef);
    
    if (!blockDoc.exists()) {
      throw new Error('Block not found');
    }

    const blockData = blockDoc.data() as Block;
    
    // Check permissions
    if (blockData.isDefault || blockData.isGlobal) {
      if (!isAdmin) {
        throw new Error('Only admins can update default or global blocks');
      }
    } else if (blockData.createdBy !== userId) {
      throw new Error('You can only update your own blocks');
    }

    // If making a block global, verify admin status
    if (updates.isGlobal && !blockData.isGlobal && !isAdmin) {
      throw new Error('Only admins can make blocks global');
    }

    await updateDoc(blockRef, {
      ...updates,
      userId: updates.isGlobal ? null : userId,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating block:', error);
    throw error;
  }
};

export const deleteBlock = async (blockId: string, isAdmin: boolean): Promise<void> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be logged in to delete blocks');
    }

    const blockRef = doc(db, COLLECTION_NAME, blockId);
    const blockDoc = await getDoc(blockRef);
    
    if (!blockDoc.exists()) {
      throw new Error('Block not found');
    }

    const blockData = blockDoc.data() as Block;

    // Check permissions
    if (blockData.isDefault || blockData.isGlobal) {
      if (!isAdmin) {
        throw new Error('Only admins can delete default or global blocks');
      }
    } else if (blockData.createdBy !== userId) {
      throw new Error('You can only delete your own blocks');
    }

    await deleteDoc(blockRef);
  } catch (error) {
    console.error('Error deleting block:', error);
    throw error;
  }
};
