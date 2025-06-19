import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { Navbar } from '../ControlsAPI/Comps';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ParentHome = ({ route, navigation }) => {
  const userData = route.params?.userData || {};
  global.pid = userData.parent.id;
  
  const parent = userData.parent || {};
  const children = userData.children || [];
  console.log("Parent Data:", userData);
  console.log("Children Data:", children);
  
  // Function to get greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Function to get greeting icon
  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'wb-sunny';
    if (hour < 17) return 'wb-sunny';
    return 'nights-stay';
  };
  
  const handleChildPress = (child) => {
    navigation.navigate('Child_info', { 
      parentData: {
        parent: parent,
        childData: child
      }
    });
  };

  const handleNotificationPress = () => {
    navigation.navigate('parentnotification', { userData: userData });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Navbar
        title="LMS" 
        userName={parent.name} 
        des={'Parent'} 
        onLogout={() => navigation.replace('Login')}
      />
      
      {/* Greeting Header */}
      <View style={styles.greetingHeader}>
        <View style={styles.greetingContent}>
          <View style={styles.greetingIconContainer}>
            <Icon name={getGreetingIcon()} size={24} color="#4F46E5" />
          </View>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingLabel}>
              {getGreeting()}
            </Text>
            <Text style={styles.parentName}>
              {parent.name || 'Parent'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleNotificationPress} style={styles.notificationButton}>
          <View style={styles.notificationIconContainer}>
            <Icon name="notifications" size={22} color="#4F46E5" />
            <View style={styles.notificationDot} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Parent Info Card */}
        <View style={styles.parentCard}>
          <View style={styles.cardHeader}>
            <Icon name="person" size={24} color="#667eea" />
            <Text style={styles.cardTitle}>Your Information</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Icon name="person-outline" size={18} color="#666" />
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{parent.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="phone" size={18} color="#666" />
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>{parent.contact}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="location-on" size={18} color="#666" />
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{parent.address}</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="family-restroom" size={18} color="#666" />
              <Text style={styles.infoLabel}>Relation</Text>
              <Text style={styles.infoValue}>{parent.relation_with_student}</Text>
            </View>
          </View>
        </View>

        {/* Children Section */}
        <View style={styles.childrenSection}>
          <View style={styles.sectionHeader}>
            <Icon name="school" size={24} color="#667eea" />
            <Text style={styles.sectionTitle}>Your Children ({children.length})</Text>
          </View>
          
          {children.map((child, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.studentCard}
              onPress={() => handleChildPress(child)}
              activeOpacity={0.8}
            >
              <View style={styles.studentImageContainer}>
                <Image 
                  source={{ uri: child.image }} 
                  style={styles.studentImage}
                  resizeMode="cover"
                />
                <View style={styles.statusIndicator} />
              </View>
              
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{child.name}</Text>
                <View style={styles.studentDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="badge" size={16} color="#666" />
                    <Text style={styles.detailText}>{child.regno}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="class" size={16} color="#666" />
                    <Text style={styles.detailText}>{child.section}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.cardAction}>
                <Icon name="arrow-forward-ios" size={20} color="#667eea" />
              </View>
            </TouchableOpacity>
          ))}
          
          {children.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="school" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No children registered</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default ParentHome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  greetingHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  greetingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  greetingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  parentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  notificationButton: {
    padding: 4,
  },
  notificationIconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    padding: 15,
  },
  parentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  infoGrid: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    width: 80,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '400',
  },
  childrenSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  studentImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  studentImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2ed573',
    borderWidth: 2,
    borderColor: '#fff',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  studentDetails: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontWeight: '400',
  },
  cardAction: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },
});