import {Item} from '../../types';

export interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

export interface CreateItemResponse {
  success: boolean;
  data?: Item;
  error?: string;
}

export interface TreeNode {
  id: string;
  name?: string;
  children?: TreeNode[];
  items?: Item[];
  [key: string]: unknown;
}
