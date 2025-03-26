import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Pressable,
  Image
} from "react-native";

import { createStackNavigator } from "@react-navigation/stack";
import { API_URL,Navbar } from "../ControlsAPI/Comps";

import Icon from "react-native-vector-icons/MaterialIcons";
import { ScrollView } from "react-native-gesture-handler";
import colors from "../ControlsAPI/colors";

// Modern color palette
const COLORS = {
  primary: "#2563eb",       // Blue-600
  primaryDark: "#1d4ed8",   // Blue-700
  primaryLight: "#dbeafe",  // Blue-100
  secondary: "#4f46e5",     // Indigo-600
  accent: "#8b5cf6",        // Violet-500
  success: "#10b981",       // Emerald-500
  danger: "#ef4444",        // Red-500
  warning: "#f59e0b",       // Amber-500
  dark: "#1e293b",          // Slate-800
  light: "#f8fafc",         // Slate-50
  white: "#ffffff",
  gray: "#64748b",          // Slate-500
  grayLight: "#f1f5f9",     // Slate-100
  border: "#e2e8f0",        // Slate-200
  shadow: "#000000",
};

// Animated Button component with press feedback
const AnimatedButton = ({ onPress, style, children, icon }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={({ pressed }) => [
        styles.animatedButtonContainer,
        style,
        { opacity: pressed ? 0.9 : 1 }
      ]}
    >
      <Animated.View
        style={[
          styles.animatedButtonInner,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {icon && <Icon name={icon} size={20} style={styles.buttonIcon} />}
        {children}
      </Animated.View>
    </Pressable>
  );
};

// Task Card component with animations
const TaskCard = ({ item, category, onPress }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Determine card color based on category
  let cardStyle = styles.taskCard;
  let iconName = "assignment";
  
  if (category === "Active Tasks") {
    cardStyle = {...styles.taskCard, borderLeftColor: COLORS.accent};
    iconName = "pending-actions";
  } else if (category === "Upcoming Tasks") {
    cardStyle = {...styles.taskCard, borderLeftColor: COLORS.warning};
    iconName = "event";
  } else if (category === "Completed Tasks") {
    cardStyle = {...styles.taskCard, borderLeftColor: COLORS.success};
    iconName = "check-circle";
  }

  return (
    <Animated.View
      style={[
        cardStyle,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.taskCardInner,
          { backgroundColor: pressed ? COLORS.primaryLight + '20' : 'transparent' }
        ]}
        android_ripple={{ color: COLORS.primaryLight, borderless: false }}
      >
        <View style={styles.taskIconContainer}>
          <Icon name={iconName} size={26} color={
            category === "Active Tasks" ? COLORS.accent :
            category === "Upcoming Tasks" ? COLORS.warning : COLORS.success
          } />
        </View>
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={styles.taskInfoRow}>
            <Icon name="book" size={14} color={COLORS.gray} />
            <Text style={styles.taskSubtitle}>{item.course_name}</Text>
          </View>
          <View style={styles.taskInfoRow}>
            <Icon name="label" size={14} color={COLORS.gray} />
            <Text style={styles.taskSubtitle}>{item.type}</Text>
          </View>
          {item.due_date && (
            <View style={styles.taskInfoRow}>
              <Icon name="event" size={14} color={COLORS.gray} />
              <Text style={styles.taskSubtitle}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
            </View>
          )}
        </View>
        <Icon name="chevron-right" size={24} color={COLORS.gray} />
      </Pressable>
    </Animated.View>
  );
};
const Stack = createStackNavigator();



const TaskDetailsScreen = ({ route, navigation }) => {
  const { task, category } = route.params;
  const isActive = category === "Active Tasks";
  const dueDate = new Date(task.due_date);
  const now = new Date();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    if (category !== "Active Tasks") return null;
    
    const diffTime = dueDate - now;
    if (diffTime <= 0) return "Overdue";
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hr${diffHours > 1 ? 's' : ''} remaining`;
    } else {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
    }
  };
  
  const timeRemaining = getTimeRemaining();
  
  return (
    <View style={styles.detailsContainer}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.detailsCard, 
          { 
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim
          }
        ]}
      >
        <View style={styles.detailsHeader}>
          <View style={styles.detailsBadge}>
            <Text style={styles.detailsBadgeText}>{task.type}</Text>
          </View>
          <Text style={styles.detailsTitle}>{task.title}</Text>
          
          <View style={styles.courseInfoContainer}>
            <Icon name="book" size={18} color={COLORS.primary} />
            <Text style={styles.courseInfo}>{task.course_name}</Text>
          </View>
          
          {timeRemaining && (
            <View style={[
              styles.timeRemainingContainer,
              timeRemaining === "Overdue" ? styles.overdue : null
            ]}>
              <Icon 
                name={timeRemaining === "Overdue" ? "error" : "timer"} 
                size={16} 
                color={timeRemaining === "Overdue" ? COLORS.white : COLORS.dark} 
              />
              <Text style={[
                styles.timeRemainingText,
                timeRemaining === "Overdue" ? styles.overdueText : null
              ]}>
                {timeRemaining}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.detailsBody}>
          <View style={styles.detailRow}>
            <Icon name="stars" size={20} color={COLORS.warning} />
            <Text style={styles.detailLabel}>Points:</Text>
            <Text style={styles.detailValue}>{task.points}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="event" size={20} color={COLORS.primary} />
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(task.start_date).toLocaleDateString()} {new Date(task.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="event-busy" size={20} color={isActive ? COLORS.danger : COLORS.gray} />
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={[styles.detailValue, isActive && styles.dueDateActive]}>
              {new Date(task.due_date).toLocaleDateString()} {new Date(task.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="person" size={20} color={COLORS.secondary} />
            <Text style={styles.detailLabel}>Creator:</Text>
            <Text style={styles.detailValue}>{task.creator_name}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.actionsContainer}>
            {task.File && (
              <AnimatedButton 
                onPress={() => Linking.openURL(task.File)}
                style={styles.downloadButton}
                icon="file-download"
              >
                <Text style={styles.buttonText}>Download Task File</Text>
              </AnimatedButton>
            )}
            
            {isActive && (
              <AnimatedButton 
                onPress={() => alert("Task Submitted Successfully!")}
                style={styles.submitButton}
                icon="send"
              >
                <Text style={styles.buttonText}>Submit Task</Text>
              </AnimatedButton>
            )}
          </View>
        </View>
      </Animated.View>
      
      <AnimatedButton 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        icon="arrow-back"
      >
        <Text style={styles.backButtonText}>Return to Tasks</Text>
      </AnimatedButton>
    </View>
  );
};



const TaskListScreen = ({ navigation, route }) => {
  const userData = route.params?.userData?.StudentInfo || {}; 
  const [tasks, setTasks] = useState({ "Active Tasks": [], "Upcoming Tasks": [], "Completed Tasks": [] });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Active Tasks");
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Fetch tasks
    fetch(`${API_URL}/api/Students/task/details?student_id=${userData.id}`)
      .then((response) => response.text())
      .then((text) => JSON.parse(text))
      .then((data) => {
        setTasks(data.TaskDetails);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      });
  }, []);

  const renderCategoryTab = (category) => {
    const isActive = activeCategory === category;
    
    return (
      <TouchableOpacity
        style={[styles.categoryTab, isActive && styles.activeCategoryTab]}
        onPress={() => setActiveCategory(category)}
        activeOpacity={0.7}
      >
        <Text style={[styles.categoryTabText, isActive && styles.activeCategoryTabText]}>
          {category} ({tasks[category]?.length || 0})
        </Text>
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your tasks...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      <Navbar 
        title="LMS" 
        userName={userData.name} 
        des={'Student'} 
        onLogout={() => navigation.replace('Login')}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSubtitle}>Manage your assignments, quizzes and more</Text>
      </View>
      
      <ScrollView 
  horizontal 
  showsHorizontalScrollIndicator={false}
  style={styles.categoryScrollView}
  contentContainerStyle={styles.categoryTabsContainer}
>
  {Object.keys(tasks).map((category) => renderCategoryTab(category))}
</ScrollView>

<FlatList
  data={tasks[activeCategory] || []}
  keyExtractor={(item) => item.task_id.toString()}
  contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }} // Adjusted padding
  showsVerticalScrollIndicator={false}
  renderItem={({ item }) => (
    <TaskCard
      item={item}
      category={activeCategory}
      onPress={() => navigation.navigate("TaskDetails", { task: item, category: activeCategory })}
    />
  )}
  ListEmptyComponent={
    <View style={styles.emptyContainer}>
      <Icon name="assignment" size={60} color={COLORS.gray} />
      <Text style={styles.emptyText}>No {activeCategory.toLowerCase()} found</Text>
    </View>
  }
/>

    </Animated.View>
  );
};
export default function App({route, navigation}) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Tasks" 
        initialParams={route.params} 
        component={TaskListScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TaskDetails" 
        component={TaskDetailsScreen} 
        options={{ 
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.light }
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { 
   
    backgroundColor: COLORS.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  categoryTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,height:60,
    paddingVertical: 8, // Add some vertical padding
    alignItems: 'center', // Center items vertically
  },categoryScrollView: {
    height: 50, // Adjust this height as needed
    flexDirection: 'row',backgroundColor:colors.grayLight,height:60
  },
  categoryTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    position: 'relative',
  },
  activeCategoryTab: {
    backgroundColor: COLORS.primaryLight,
  },
  categoryTabText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
  },
  taskList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginVertical: 6,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    overflow: 'hidden',
  },
  taskCardInner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  taskIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 6,
  },
  taskInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  taskSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
  },
  // Details Screen Styles
  detailsContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 16,
    paddingTop: 40,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  detailsHeader: {
    padding: 20,
    backgroundColor: COLORS.primaryLight + '40', // 40% opacity
  },
  detailsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  detailsBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  courseInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseInfo: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  overdue: {
    backgroundColor: COLORS.danger,
  },
  timeRemainingText: {
    fontSize: 12,
    color: COLORS.dark,
    marginLeft: 4,
    fontWeight: '500',
  },
  overdueText: {
    color: COLORS.white,
  },
  detailsBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 15,
    color: COLORS.gray,
    width: 90,
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.dark,
    flex: 1,
    fontWeight: '500',
  },
  dueDateActive: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  actionsContainer: {
    marginTop: 8,
  },
  animatedButtonContainer: {
    overflow: 'hidden',
    marginVertical: 8,
    borderRadius: 8,
  },
  animatedButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonIcon: {
    color: COLORS.white,
    marginRight: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: COLORS.secondary,
  },
  submitButton: {
    backgroundColor: COLORS.success,
  },
  backButton: {
    backgroundColor: COLORS.grayLight,
    marginTop: 16,
  },
  backButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
});