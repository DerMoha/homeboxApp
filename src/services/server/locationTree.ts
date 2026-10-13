import {TreeNode} from './types';

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
