import React from "react";
import { Modal, Pressable, StyleProp, ViewStyle } from "react-native";

type BottomModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  overlayStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function BottomModal({
  visible,
  onClose,
  children,
  overlayStyle,
  contentStyle,
}: BottomModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          {
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.1)",
          },
          overlayStyle,
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            {
              backgroundColor: "white",
              padding: 24,
              marginBottom: 50,
              borderRadius: 10,
              gap: 16,
            },
            contentStyle,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
