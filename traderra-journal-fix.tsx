import React, { useState } from 'react';
import { Tree, NodeRendererProps, TreeApi } from 'react-arborist';

// Define the tree node interface
interface FolderNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
}

// Sample tree data structure
const initialData: FolderNode[] = [
  {
    id: '1',
    name: 'Trading Journals',
    type: 'folder',
    children: [
      {
        id: '2',
        name: 'Q1 2024',
        type: 'folder',
        children: [
          { id: '3', name: 'January.md', type: 'file' },
          { id: '4', name: 'February.md', type: 'file' },
          { id: '5', name: 'March.md', type: 'file' },
        ]
      },
      {
        id: '6',
        name: 'Q2 2024',
        type: 'folder',
        children: [
          { id: '7', name: 'April.md', type: 'file' },
          { id: '8', name: 'May.md', type: 'file' },
        ]
      }
    ]
  },
  {
    id: '9',
    name: 'Strategies',
    type: 'folder',
    children: [
      { id: '10', name: 'Scalping.md', type: 'file' },
      { id: '11', name: 'Swing Trading.md', type: 'file' },
    ]
  }
];

// Node renderer component
const Node: React.FC<NodeRendererProps<FolderNode>> = ({ node, style, dragHandle }) => {
  const { data, isLeaf, isOpen, toggle } = node;

  // Handle null/undefined data
  if (!data || !data.id) {
    console.error('Node data is undefined or missing id:', data);
    return null;
  }

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`flex items-center p-2 hover:bg-gray-100 cursor-pointer ${
        node.isSelected ? 'bg-blue-100' : ''
      }`}
      onClick={() => node.isInternal && toggle()}
    >
      <span className="mr-2">
        {data.type === 'folder' ? (
          isOpen ? '📂' : '📁'
        ) : (
          '📄'
        )}
      </span>
      <span className="flex-1">{data.name}</span>
    </div>
  );
};

// Main component
const TraderraJournal: React.FC = () => {
  const [treeData, setTreeData] = useState<FolderNode[]>(initialData);
  const [treeApi, setTreeApi] = useState<TreeApi<FolderNode> | null>(null);

  // Handle tree data changes
  const handleChange = (data: FolderNode[]) => {
    // Validate data before setting
    const validatedData = data.filter(item => item && item.id);
    setTreeData(validatedData);
  };

  // Create new folder
  const createFolder = () => {
    if (!treeApi) return;

    const newFolder: FolderNode = {
      id: `folder_${Date.now()}`,
      name: 'New Folder',
      type: 'folder',
      children: []
    };

    const selectedNode = treeApi.selectedNodes[0];
    if (selectedNode && selectedNode.data.type === 'folder') {
      // Add to selected folder
      selectedNode.data.children = selectedNode.data.children || [];
      selectedNode.data.children.push(newFolder);
    } else {
      // Add to root
      setTreeData(prev => [...prev, newFolder]);
    }

    // Refresh the tree
    treeApi.refresh();
  };

  // Create new file
  const createFile = () => {
    if (!treeApi) return;

    const newFile: FolderNode = {
      id: `file_${Date.now()}`,
      name: 'New Journal Entry.md',
      type: 'file'
    };

    const selectedNode = treeApi.selectedNodes[0];
    if (selectedNode && selectedNode.data.type === 'folder') {
      selectedNode.data.children = selectedNode.data.children || [];
      selectedNode.data.children.push(newFile);
    } else {
      setTreeData(prev => [...prev, newFile]);
    }

    treeApi.refresh();
  };

  return (
    <div className="w-full h-screen p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">Traderra Journal</h1>
        <div className="flex gap-2 mb-4">
          <button
            onClick={createFolder}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            New Folder
          </button>
          <button
            onClick={createFile}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            New Entry
          </button>
        </div>
      </div>

      <div className="border border-gray-300 rounded h-96">
        <Tree<FolderNode>
          ref={(tree) => setTreeApi(tree)}
          data={treeData}
          onChange={handleChange}
          onActivate={(node) => {
            console.log('Activated node:', node.data);
          }}
          onSelect={(nodes) => {
            console.log('Selected nodes:', nodes.map(n => n.data));
          }}
          width="100%"
          height="100%"
          indent={24}
          rowHeight={32}
        >
          {Node}
        </Tree>
      </div>
    </div>
  );
};

export default TraderraJournal;