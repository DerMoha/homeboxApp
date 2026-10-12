import {Item} from '../../types';

export interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

export interface CreateItemResponse {
  uncertain?: boolean;
  success: boolean;
  data?: Item;
  error?: string;
  warning?: string;
}

export interface TreeNode {
  id: string;
  name?: string;
  type?: string;
  children?: TreeNode[];
  items?: Item[];
  [key: string]: unknown;
}
