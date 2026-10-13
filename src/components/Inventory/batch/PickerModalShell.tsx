import React, {ReactNode} from 'react';
import {Sheet} from '../../common/Sheet';
export const PickerModalShell = ({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => (
  <Sheet visible={visible} title={title} onClose={onClose}>
    {children}
  </Sheet>
);
