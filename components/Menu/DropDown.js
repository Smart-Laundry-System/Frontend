import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  StyleSheet,
} from 'react-native';

const SCREEN = Dimensions.get('window');

export default function DropDown({
  visible,
  anchorRef,          
  options = [],          
  onSelect = () => {},
  onRequestClose = () => {},
  width = 220,
  offsetY = 8,         
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && anchorRef?.current?.measureInWindow) {
      anchorRef.current.measureInWindow((x, y, w, h) => {
        const left = Math.min(x, SCREEN.width - width - 12);
        const top = y + h + offsetY;
        setPos({ left, top });
      });
    }
  }, [visible, anchorRef, width, offsetY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onRequestClose}>
        <View />
      </TouchableOpacity>

      <View style={[styles.card, { width, top: pos.top, left: pos.left }]}>
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={opt.value ?? opt.label}
            style={[styles.item, idx !== options.length - 1 && styles.itemDivider]}
            onPress={() => {
              onSelect(opt);
              onRequestClose();
            }}
          >
            <Text style={styles.itemText}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6E6',
  },
  itemText: {
    fontSize: 16,
    color: '#222',
  },
});
