import React, {useRef, useState} from 'react';
import {
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {attachmentName} from '../../utils/attachmentNames';
import {ItemAttachment} from '../../types';
import {getImageSource} from '../../utils/imageUtils';
import {Button} from '../common/Button';
import {useTheme} from '../../theme/ThemeContext';

function ZoomPhoto({
  itemId,
  photo,
  width,
}: {
  itemId: string;
  photo: ItemAttachment;
  width: number;
}) {
  const [transform, setTransform] = useState({scale: 1, x: 0, y: 0});
  const current = useRef(transform);
  current.current = transform;
  const initial = useRef({distance: 0, scale: 1, x: 0, y: 0});
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: event =>
        event.nativeEvent.touches.length > 1,
      onMoveShouldSetPanResponder: event =>
        event.nativeEvent.touches.length > 1 || current.current.scale > 1,
      onPanResponderGrant: event => {
        const [a, b] = event.nativeEvent.touches;
        initial.current = {
          ...current.current,
          distance: b ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) : 0,
        };
      },
      onPanResponderMove: (event, gesture) => {
        const [a, b] = event.nativeEvent.touches;
        if (b) {
          const distance = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
          if (!initial.current.distance) {
            initial.current.distance = distance;
          }
          setTransform({
            ...current.current,
            scale: Math.max(
              1,
              Math.min(
                4,
                (initial.current.scale * distance) / initial.current.distance,
              ),
            ),
          });
        } else if (current.current.scale > 1) {
          setTransform({
            ...current.current,
            x: initial.current.x + gesture.dx,
            y: initial.current.y + gesture.dy,
          });
        }
      },
      onPanResponderRelease: () => {
        if (current.current.scale <= 1) {
          setTransform({scale: 1, x: 0, y: 0});
        }
      },
    }),
  ).current;
  const zoom = (delta: number) =>
    setTransform(value => ({
      scale: Math.max(1, Math.min(4, value.scale + delta)),
      x: 0,
      y: 0,
    }));
  return (
    <View style={[styles.slide, {width}]}>
      <View
        style={styles.photoArea}
        {...responder.panHandlers}
        accessible
        accessibilityLabel={`Photo ${attachmentName(photo)}, zoom ${Math.round(transform.scale * 100)} percent`}
        accessibilityRole="adjustable"
        accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
        onAccessibilityAction={event =>
          zoom(event.nativeEvent.actionName === 'increment' ? 0.5 : -0.5)
        }>
        <Image
          source={getImageSource(itemId, photo.id)}
          style={[
            styles.fullPhoto,
            {
              transform: [
                {translateX: transform.x},
                {translateY: transform.y},
                {scale: transform.scale},
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>
      <Button title="Zoom in" variant="secondary" onPress={() => zoom(0.5)} />
      <Button title="Zoom out" variant="secondary" onPress={() => zoom(-0.5)} />
      <Button
        title="Reset zoom"
        variant="secondary"
        onPress={() => setTransform({scale: 1, x: 0, y: 0})}
      />
    </View>
  );
}
export function PhotoGallery({
  itemId,
  photos,
}: {
  itemId: string;
  photos: ItemAttachment[];
}) {
  const {theme} = useTheme();
  const {width} = useWindowDimensions();
  const [selected, setSelected] = useState<number | null>(null);
  const pager = useRef<React.ElementRef<typeof ScrollView>>(null);
  if (!photos.length) {
    return null;
  }
  return (
    <>
      <Text
        accessibilityRole="header"
        style={{color: theme.colors.text.primary}}>
        Photos ({photos.length})
      </Text>
      <ScrollView horizontal contentContainerStyle={styles.thumbnails}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id}
            accessibilityRole="button"
            accessibilityLabel={`Open photo ${index + 1}${photo.primary ? ', primary' : ''}`}
            onPress={() => setSelected(index)}>
            <Image
              source={getImageSource(itemId, photo.id)}
              style={styles.thumbnail}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Modal
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
        onShow={() =>
          pager.current?.scrollTo({x: (selected || 0) * width, animated: false})
        }>
        <View
          style={[
            styles.fullscreen,
            {backgroundColor: theme.colors.background.primary},
          ]}>
          <Button
            title="Close gallery"
            variant="secondary"
            onPress={() => setSelected(null)}
          />
          <Text style={{color: theme.colors.text.primary}}>
            Swipe between photos. Pinch to zoom; drag to pan.
          </Text>
          <ScrollView ref={pager} horizontal pagingEnabled>
            {photos.map(photo => (
              <ZoomPhoto
                key={photo.id}
                itemId={itemId}
                photo={photo}
                width={width}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  thumbnails: {gap: 12, paddingVertical: 12},
  thumbnail: {width: 100, height: 100, borderRadius: 8},
  fullscreen: {flex: 1, paddingTop: 48, paddingBottom: 24},
  slide: {flex: 1, gap: 8, padding: 12},
  photoArea: {flex: 1, overflow: 'hidden', minHeight: 200},
  fullPhoto: {width: '100%', height: '100%'},
});
