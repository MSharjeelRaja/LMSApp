import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const CircularLoader = ({ size = 50, color = '#007BFF' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CircularLoader;
