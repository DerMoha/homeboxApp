import React, {useState} from 'react';
import {Button} from './Button';
import {Sheet} from './Sheet';
export interface MenuAction {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}
export function ActionMenu({
  title = 'More actions',
  actions,
}: {
  title?: string;
  actions: MenuAction[];
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button
        title={title}
        icon="more-horiz"
        size="small"
        variant="ghost"
        onPress={() => setVisible(true)}
      />
      <Sheet title={title} visible={visible} onClose={() => setVisible(false)}>
        {actions.map(action => (
          <Button
            key={action.title}
            title={action.title}
            variant={action.destructive ? 'danger' : 'ghost'}
            disabled={action.disabled}
            onPress={() => {
              setVisible(false);
              action.onPress();
            }}
          />
        ))}
      </Sheet>
    </>
  );
}
