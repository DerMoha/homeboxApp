import React, {useState} from 'react';
import {Button} from '../common/Button';
import {Sheet} from '../common/Sheet';
import {MetadataForm} from './MetadataForm';
import {Label, Location} from '../../types';
type Props =
  | {kind: 'location'; onCreated: (location: Location) => void}
  | {kind: 'label'; onCreated: (label: Label) => void};
export function CreateMetadataButton(props: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Button
        title={`New ${props.kind}`}
        variant="ghost"
        onPress={() => setVisible(true)}
      />
      <Sheet
        title={`New ${props.kind}`}
        visible={visible}
        onClose={() => setVisible(false)}>
        <MetadataForm
          kind={props.kind}
          onCancel={() => setVisible(false)}
          onCreated={value => {
            if (props.kind === 'location') {
              props.onCreated(value as Location);
            } else {
              props.onCreated(value as Label);
            }
            setVisible(false);
          }}
        />
      </Sheet>
    </>
  );
}
