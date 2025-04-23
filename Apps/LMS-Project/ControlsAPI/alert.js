import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';  // Fixed import
import colors from '../ControlsAPI/colors';

const { width } = Dimensions.get('window');

// Create Alert Context
const AlertContext = createContext();

// Alert Provider Component
export const AlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    type: 'success',
    title: '',
    message: '',
    duration: 3000,
    position: 'top'
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const showAlert = (type, message, title = '', duration = 3000, position = 'top') => {
    setAlertProps({
      type,
      title: title || getDefaultTitle(type),
      message,
      duration,
      position
    });
    
    setVisible(true);
  };

  const hideAlert = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setVisible(false);
    });
  };

  const getDefaultTitle = (type) => {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      case 'info': return 'Information';
      default: return 'Alert';
    }
  };

  useEffect(() => {
    if (visible) {
      // Reset animations when showing
      fadeAnim.setValue(0);
      slideAnim.setValue(-100);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      // Auto-dismiss if duration is set
      if (alertProps.duration > 0) {
        const timer = setTimeout(() => {
          hideAlert();
        }, alertProps.duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, alertProps]);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {visible && <CustomAlert {...alertProps} onClose={hideAlert} fadeAnim={fadeAnim} slideAnim={slideAnim} />}
    </AlertContext.Provider>
  );
};

// Hook to use the alert
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

// The actual Alert component
const CustomAlert = ({ 
  type = 'success',
  title = '',
  message = '',
  position = 'top',
  onClose,
  fadeAnim,
  slideAnim
}) => {
  // Alert configuration based on type
  const alertConfig = {
    success: {
      icon: 'checkcircle',
      color: colors.secondaryLight || '#dcfce7',
      borderColor: colors.secondary || '#2ecc71',
      iconColor: colors.green || '#008035',
      title: title || 'Success'
    },
    error: {
      icon: 'closecircle',
      color: colors.dangerLight || '#fee2e2',
      borderColor: colors.danger || '#e74c3c',
      iconColor: colors.red || '#D60000',
      title: title || 'Error'
    },
    warning: {
      icon: 'exclamationcircle',
      color: colors.warningLight || '#fef9c3',
      borderColor: colors.warning || '#f1c40f',
      iconColor: colors.warning || '#f1c40f',
      title: title || 'Warning'
    },
    info: {
      icon: 'infocircle',
      color: colors.infoLight || '#ccfbf1',
      borderColor: colors.info || '#1abc9c',
      iconColor: colors.info || '#1abc9c',
      title: title || 'Information'
    }
  };

  const config = alertConfig[type] || alertConfig.success;

  // Position style based on the position prop
  const getPositionStyle = () => {
    switch (position) {
      case 'top': return { top: 20 };
      case 'center': return { top: '40%' };
      case 'bottom': return { bottom: 20 };
      default: return { top: 20 };
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: config.color,
          borderLeftColor: config.borderColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          ...getPositionStyle()
        }
      ]}
    >
      <View style={styles.iconContainer}>
        <AntDesign name={config.icon} size={28} color={config.iconColor} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>{config.title}</Text>
        {message ? <Text style={styles.messageText}>{message}</Text> : null}
      </View>
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <AntDesign name="close" size={20} color={colors.black || '#000000'} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Fixed Alert helper functions that don't use hooks directly
export const Alert = {
  // These functions need to be called from within a component using the context
  show: (context, type, message, title = '', duration = 3000, position = 'top') => {
    if (context && context.showAlert) {
      context.showAlert(type, message, title, duration, position);
    }
  },
  
  // Convenience methods that need the context passed in
  success: (context, message, title = '', duration = 3000, position = 'top') => {
    Alert.show(context, 'success', message, title, duration, position);
  },
  
  error: (context, message, title = '', duration = 3000, position = 'top') => {
    Alert.show(context, 'error', message, title, duration, position);
  },
  
  warning: (context, message, title = '', duration = 3000, position = 'top') => {
    Alert.show(context, 'warning', message, title, duration, position);
  },
  
  info: (context, message, title = '', duration = 3000, position = 'top') => {
    Alert.show(context, 'info', message, title, duration, position);
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width - 40,
    alignSelf: 'center',
    minHeight: 60,
    borderRadius: 8,
    borderLeftWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999
  },
  iconContainer: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentContainer: {
    flex: 1,
    paddingRight: 15
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.black || '#000000',
    marginBottom: 2
  },
  messageText: {
    fontSize: 14,
    color: colors.text?.primary || '#333333'
  },
  closeButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center'
  }
});