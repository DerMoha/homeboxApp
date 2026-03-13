import {useState, useCallback, useEffect, useMemo} from 'react';

interface UseBatchSelectionReturn {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  isMoveModalVisible: boolean;
  isLabelModalVisible: boolean;
  selectedLabelIds: string[];
  isApplying: boolean;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  exitSelectionMode: () => void;
  enterSelectionMode: (id?: string) => void;
  openMoveModal: () => void;
  closeMoveModal: () => void;
  openLabelModal: () => void;
  closeLabelModal: () => void;
  toggleLabelSelection: (labelId: string) => void;
  clearSelectedLabels: () => void;
  setIsApplying: (value: boolean) => void;
  selectedCount: number;
}

export const useBatchSelection = (): UseBatchSelectionReturn => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [isLabelModalVisible, setIsLabelModalVisible] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    if (isSelectionMode && selectedIds.size === 0) {
      setIsSelectionMode(false);
    }
  }, [isSelectionMode, selectedIds]);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setIsMoveModalVisible(false);
    setIsLabelModalVisible(false);
    setSelectedLabelIds([]);
  }, []);

  const enterSelectionMode = useCallback((id?: string) => {
    setIsSelectionMode(true);
    if (id) {
      setSelectedIds(new Set([id]));
    }
  }, []);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  const openMoveModal = useCallback(() => {
    setIsMoveModalVisible(true);
  }, []);

  const closeMoveModal = useCallback(() => {
    setIsMoveModalVisible(false);
  }, []);

  const openLabelModal = useCallback(() => {
    setIsLabelModalVisible(true);
  }, []);

  const closeLabelModal = useCallback(() => {
    setIsLabelModalVisible(false);
  }, []);

  const toggleLabelSelection = useCallback((labelId: string) => {
    setSelectedLabelIds(prev =>
      prev.includes(labelId)
        ? prev.filter(currentId => currentId !== labelId)
        : [...prev, labelId],
    );
  }, []);

  const clearSelectedLabels = useCallback(() => {
    setSelectedLabelIds([]);
  }, []);

  return {
    selectedIds,
    isSelectionMode,
    isMoveModalVisible,
    isLabelModalVisible,
    selectedLabelIds,
    isApplying,
    toggleSelection,
    selectAll,
    clearSelection,
    exitSelectionMode,
    enterSelectionMode,
    openMoveModal,
    closeMoveModal,
    openLabelModal,
    closeLabelModal,
    toggleLabelSelection,
    clearSelectedLabels,
    setIsApplying,
    selectedCount,
  };
};
