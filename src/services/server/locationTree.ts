import {Item} from '../../types';
import {TreeNode} from './types';

export const findLocationNode = (
  node: TreeNode,
  targetId: string,
): TreeNode | null => {
  if (node.id === targetId) {
    return node;
  }

  if (!node.children || !Array.isArray(node.children)) {
    return null;
  }

  for (const child of node.children) {
    const found = findLocationNode(child, targetId);
    if (found) {
      return found;
    }
  }

  return null;
};

export const findLocationInTree = (
  tree: TreeNode | TreeNode[],
  targetId: string,
): TreeNode | null => {
  if (Array.isArray(tree)) {
    for (const node of tree) {
      const found = findLocationNode(node, targetId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  return findLocationNode(tree, targetId);
};

export const buildLocationPath = (
  tree: TreeNode[],
  targetLocationId: string,
) => {
  const path: {id: string; name: string}[] = [];

  const findPath = (nodes: TreeNode[], targetId: string): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.unshift({id: node.id, name: node.name || 'Unknown'});
        return true;
      }

      if (node.children && node.children.length > 0) {
        if (findPath(node.children, targetId)) {
          path.unshift({id: node.id, name: node.name || 'Unknown'});
          return true;
        }
      }
    }

    return false;
  };

  findPath(tree, targetLocationId);
  return path;
};

export const getNodeItems = (node: TreeNode | null): Item[] =>
  node?.items ? node.items : [];
