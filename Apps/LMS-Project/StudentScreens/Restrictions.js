import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { API_URL, Navbar } from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';

const colors = {
  primary: '#4a90e2',
  secondary: '#f8f9fa',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  text: '#000000',
  textSecondary: '#666666',
  background: '#ffffff',
  border: '#e0e0e0',
  shadow: '#000000'
};

const Restrictions = ({route, navigation}) => {
  const userData = route.params?.userData || {};
  const [loading, setLoading] = useState(true);
  const [restrictionsData, setRestrictionsData] = useState(null);
  const [selectedParent, setSelectedParent] = useState(0);
  const [localRestrictions, setLocalRestrictions] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchRestrictions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/Students/parents-restrictions?student_id=${userData.id}`
      );
      const data = await response.json();
      if (data.status) {
        setRestrictionsData(data.data);
        setLocalRestrictions(JSON.parse(JSON.stringify(data.data))); // Deep copy
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error fetching restrictions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestrictions();
  }, []);

  const showConfirmationAlert = (parentId, courseId, restrictionType, restriction) => {
    const isAllowed = restriction.status === 'Allowed';
    const action = isAllowed ? 'restrict' : 'allow';
    const restrictionName = restrictionType.charAt(0).toUpperCase() + restrictionType.slice(1);
    
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${action} ${restrictionName} access for this course?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: () => toggleRestriction(parentId, courseId, restrictionType),
          style: "destructive"
        }
      ]
    );
  };

  const toggleRestriction = async (parentId, courseId, restrictionType) => {
    if (!localRestrictions) return;

    // Create a deep copy of the current state
    const updatedRestrictions = JSON.parse(JSON.stringify(localRestrictions));
    const parentIndex = updatedRestrictions.parents.findIndex(p => p.parent_id === parentId);
    const courseIndex = updatedRestrictions.parents[parentIndex].course_restrictions.findIndex(
      c => c.course_id === courseId
    );

    const currentStatus = updatedRestrictions.parents[parentIndex]
      .course_restrictions[courseIndex]
      .restrictions[restrictionType].status;

    // Immediately update local state
    updatedRestrictions.parents[parentIndex]
      .course_restrictions[courseIndex]
      .restrictions[restrictionType].status = 
        currentStatus === 'Allowed' ? 'Not Allowed' : 'Allowed';

    setLocalRestrictions(updatedRestrictions);

    try {
      if (currentStatus === 'Allowed') {
        // Add restriction
        const response = await fetch(`${API_URL}/api/Students/restricted-parent-courses/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            parent_id: parentId.toString(),
            student_id: userData.id.toString(),
            course_id: courseId.toString(),
            restriction_type: restrictionType
          })
        });
        const data = await response.json();
        if (!data.message.includes('successfully')) {
          // Revert if API fails
          fetchRestrictions();
        }
      } else {
        // Remove restriction
        const restrictionId = updatedRestrictions.parents[parentIndex]
          .course_restrictions[courseIndex]
          .restrictions[restrictionType].restriction_id;
        
        const response = await fetch(
          `${API_URL}/api/Students/restricted-parent-courses/delete/${restrictionId}`, 
          { method: 'DELETE' }
        );
        const data = await response.json();
        if (!data.message.includes('successfully')) {
          // Revert if API fails
          fetchRestrictions();
        }
      }
    } catch (error) {
      console.error('Error toggling restriction:', error);
      // Revert on error
      fetchRestrictions();
    }
  };

  const getRestrictionIcon = (restrictionType) => {
    switch (restrictionType) {
      case 'core':
        return 'home';
      case 'attendance':
        return 'event-available';
      case 'task':
        return 'assignment';
      case 'exam':
        return 'quiz';
      default:
        return 'security';
    }
  };

  const renderToggleButton = (parentId, courseId, restrictionType, restriction) => {
    const isAllowed = restriction.status === 'Allowed';
    
    return (
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isAllowed ? styles.toggleAllowed : styles.toggleNotAllowed
        ]}
        onPress={() => showConfirmationAlert(parentId, courseId, restrictionType, restriction)}
        activeOpacity={0.7}
      >
        <Icon 
          name={isAllowed ? 'check-circle' : 'block'} 
          size={16} 
          color={colors.background} 
          style={styles.toggleIcon}
        />
        <Text style={styles.toggleText}>
          {isAllowed ? 'ALLOWED' : 'RESTRICTED'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading restrictions...</Text>
      </View>
    );
  }

  if (!localRestrictions) {
    return (
      <View style={styles.container}>
        <Navbar
          title="Parent Restrictions"
          userName={userData.name}
          des="Student"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          onLogout={() => navigation.replace('Login')}
        />
        <View style={styles.emptyContainer}>
          <Icon name="error-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No restrictions data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar
        title="Parent Restrictions"
        userName={userData.name}
        des="Student"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        onLogout={() => navigation.replace('Login')}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Parent tabs */}
        <View style={styles.parentTabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.parentTabsContent}
          >
            {localRestrictions.parents.map((parent, index) => (
              <TouchableOpacity
                key={parent.parent_id}
                style={[
                  styles.parentTab,
                  selectedParent === index && styles.selectedParentTab
                ]}
                onPress={() => setSelectedParent(index)}
                activeOpacity={0.7}
              >
                <View style={styles.parentTabContent}>
                  <Icon 
                    name="person" 
                    size={20} 
                    color={selectedParent === index ? colors.background : colors.primary}
                    style={styles.parentIcon}
                  />
                  <View style={styles.parentInfo}>
                    <Text style={[
                      styles.parentName,
                      selectedParent === index && styles.selectedParentName
                    ]}>
                      {parent.name}
                    </Text>
                    <Text style={[
                      styles.parentRelation,
                      selectedParent === index && styles.selectedParentRelation
                    ]}>
                      {parent.relation}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Course cards */}
        <ScrollView style={styles.coursesContainer} showsVerticalScrollIndicator={false}>
          {localRestrictions.parents[selectedParent]?.course_restrictions.map((course) => (
            <View key={course.course_id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <Icon name="book" size={24} color={colors.primary} />
                <Text style={styles.courseTitle}>{course.course_name}</Text>
              </View>
              
              <View style={styles.permissionsContainer}>
                <View style={styles.permissionRow}>
                  <View style={styles.permissionLabel}>
                    <Icon 
                      name={getRestrictionIcon('core')} 
                      size={20} 
                      color={colors.textSecondary}
                      style={styles.permissionIcon}
                    />
                    <Text style={styles.permissionText}>Core Access</Text>
                  </View>
                  {renderToggleButton(
                    localRestrictions.parents[selectedParent].parent_id,
                    course.course_id,
                    'core',
                    course.restrictions.core
                  )}
                </View>

                <View style={styles.permissionRow}>
                  <View style={styles.permissionLabel}>
                    <Icon 
                      name={getRestrictionIcon('attendance')} 
                      size={20} 
                      color={colors.textSecondary}
                      style={styles.permissionIcon}
                    />
                    <Text style={styles.permissionText}>Attendance</Text>
                  </View>
                  {renderToggleButton(
                    localRestrictions.parents[selectedParent].parent_id,
                    course.course_id,
                    'attendance',
                    course.restrictions.attendance
                  )}
                </View>

                <View style={styles.permissionRow}>
                  <View style={styles.permissionLabel}>
                    <Icon 
                      name={getRestrictionIcon('task')} 
                      size={20} 
                      color={colors.textSecondary}
                      style={styles.permissionIcon}
                    />
                    <Text style={styles.permissionText}>Tasks</Text>
                  </View>
                  {renderToggleButton(
                    localRestrictions.parents[selectedParent].parent_id,
                    course.course_id,
                    'task',
                    course.restrictions.task
                  )}
                </View>

                <View style={styles.permissionRow}>
                  <View style={styles.permissionLabel}>
                    <Icon 
                      name={getRestrictionIcon('exam')} 
                      size={20} 
                      color={colors.textSecondary}
                      style={styles.permissionIcon}
                    />
                    <Text style={styles.permissionText}>Exams</Text>
                  </View>
                  {renderToggleButton(
                    localRestrictions.parents[selectedParent].parent_id,
                    course.course_id,
                    'exam',
                    course.restrictions.exam
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  parentTabsContainer: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  parentTabsContent: {
    paddingHorizontal: 8,
  },
  parentTab: {
    padding: 12,
    margin: 8,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedParentTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  parentTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentIcon: {
    marginRight: 8,
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedParentName: {
    color: colors.background,
  },
  parentRelation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedParentRelation: {
    color: colors.background,
    opacity: 0.8,
  },
  coursesContainer: {
    flex: 1,
    padding: 16,
  },
  courseCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  permissionsContainer: {
    gap: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  permissionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionIcon: {
    marginRight: 12,
  },
  permissionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
  },
  toggleAllowed: {
    backgroundColor: colors.success,
  },
  toggleNotAllowed: {
    backgroundColor: colors.error,
  },
  toggleIcon: {
    marginRight: 6,
  },
  toggleText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default Restrictions;