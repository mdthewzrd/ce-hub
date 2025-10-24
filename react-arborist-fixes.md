# React Arborist "Cannot read properties of undefined (reading 'id')" Fix

## Problem
The error `TypeError: Cannot read properties of undefined (reading 'id')` occurs when React Arborist tries to access node data that is null, undefined, or missing the required `id` property.

## Root Causes

1. **Missing `id` property**: Each tree node must have a unique `id`
2. **Null/undefined data**: Tree data contains null or undefined nodes
3. **Improper data structure**: Data doesn't match expected TreeNode interface
4. **State updates**: Async state updates causing temporary undefined states

## Solutions

### 1. Ensure Proper Data Structure

```typescript
interface TreeNode {
  id: string | number;  // REQUIRED: Must be unique
  name: string;
  children?: TreeNode[];
  // Add other properties as needed
}
```

### 2. Data Validation

```typescript
// Validate data before passing to Tree
const validateTreeData = (data: TreeNode[]): TreeNode[] => {
  return data.filter(node => {
    if (!node || !node.id) {
      console.warn('Invalid node found:', node);
      return false;
    }

    // Recursively validate children
    if (node.children) {
      node.children = validateTreeData(node.children);
    }

    return true;
  });
};

// Use in your component
const [treeData, setTreeData] = useState<TreeNode[]>([]);

useEffect(() => {
  // Validate before setting
  const validData = validateTreeData(rawData);
  setTreeData(validData);
}, [rawData]);
```

### 3. Safe Node Renderer

```typescript
const Node: React.FC<NodeRendererProps<TreeNode>> = ({ node, style, dragHandle }) => {
  const { data } = node;

  // Guard against undefined data
  if (!data || !data.id) {
    console.error('Node data is undefined or missing id:', data);
    return <div style={style}>Invalid node</div>;
  }

  return (
    <div ref={dragHandle} style={style}>
      {data.name}
    </div>
  );
};
```

### 4. Tree Configuration with Error Handling

```typescript
<Tree<TreeNode>
  data={treeData}
  onChange={(newData) => {
    // Validate before updating
    const validData = validateTreeData(newData);
    setTreeData(validData);
  }}
  width="100%"
  height="100%"
  // Add error boundary props if available
  onError={(error) => {
    console.error('Tree error:', error);
  }}
>
  {Node}
</Tree>
```

### 5. Loading State Protection

```typescript
const MyTreeComponent = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTreeData()
      .then(data => {
        const validData = validateTreeData(data);
        setTreeData(validData);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!treeData.length) {
    return <div>No data available</div>;
  }

  return (
    <Tree data={treeData}>
      {Node}
    </Tree>
  );
};
```

### 6. Package Version Check

Ensure you're using a compatible version:

```json
{
  "dependencies": {
    "react-arborist": "^3.4.0",
    "@types/react": "^18.0.0"
  }
}
```

## Quick Debug Steps

1. **Console log your data**:
```typescript
console.log('Tree data:', treeData);
treeData.forEach((node, index) => {
  console.log(`Node ${index}:`, node, 'has id:', !!node?.id);
});
```

2. **Check for async issues**:
```typescript
// Make sure data is loaded before rendering
if (!treeData || treeData.length === 0) {
  return <div>Loading...</div>;
}
```

3. **Validate data shape**:
```typescript
const isValidNode = (node: any): node is TreeNode => {
  return node && typeof node.id !== 'undefined' && node.id !== null;
};
```

## Working Example Data

```typescript
const sampleData: TreeNode[] = [
  {
    id: '1',
    name: 'Root Folder',
    children: [
      {
        id: '2',
        name: 'Subfolder',
        children: [
          { id: '3', name: 'File 1' },
          { id: '4', name: 'File 2' }
        ]
      }
    ]
  }
];
```

This structure guarantees that every node has a valid `id` property, preventing the undefined error.