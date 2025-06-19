import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { API_URL, Navbar } from '../ControlsAPI/Comps';

const NotificationScreen = ({ navigation, route }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { userData } = route.params || {};

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(
        `${API_URL}/api/parents/Notification?parent_id=${global.pid}`
      );
      const data = await response.json();
      
      if (data.status === 'success') {
        setNotifications(data.data);
      } else {
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err.message || 'Network request failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderSenderIcon = (sender) => {
    switch(sender.toLowerCase()) {
      case 'teacher':
        return <Icon name="school" size={20} color="#4CAF50" />;
      case 'admin':
        return <Icon name="security" size={20} color="#2196F3" />;
      case 'datacell':
      case 'hod':
        return <Icon name="dns" size={20} color="#9C27B0" />;
      default:
        return <Icon name="notifications" size={20} color="#FF9800" />;
    }
  };

  const handleMediaPress = (item) => {
    if (item.media_type === 'link') {
      Linking.openURL(item.media).catch(err => 
        console.error('Failed to open URL:', err)
      );
    }
    // For images, we'll show them in the card itself
  };

  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.senderInfo}>
          {item.sender_image ? (
            <Image 
              source={{ uri: item.sender_image }} 
              style={styles.senderImage} 
            />
          ) : (
            <View style={styles.senderIcon}>
              {renderSenderIcon(item.sender)}
            </View>
          )}
          <View style={styles.senderDetails}>
            <Text style={styles.senderName}>
              {item.sender_name || item.sender || 'System'}
            </Text>
            <Text style={styles.notificationDate}>
              {formatDate(item.notification_date)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.description}</Text>
      </View>

      {item.media && (
        <TouchableOpacity 
          style={styles.mediaContainer}
          onPress={() => handleMediaPress(item)}
          activeOpacity={0.7}
        >
          {item.media_type === 'image' ? (
            <Image
              source={{ uri: item.media }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.linkContainer}>
              <Icon name="link" size={18} color="#3498db" />
              <Text style={styles.linkText} numberOfLines={1}>
                {item.media}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={50} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchNotifications}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar
        title="Notifications"
        userName={userData?.parent?.name}
        des="Parent"
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={50} color="#9E9E9E" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll see notifications here when you receive them
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchNotifications}
            colors={['#3F51B5']}
            tintColor="#3F51B5"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#616161',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3F51B5',
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listHeader: {
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  senderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  notificationDate: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },
  cardBody: {
    padding: 16,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
  },
  mediaContainer: {
    marginTop: 8,
  },
  mediaImage: {
    width: '100%',
    height: 200,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#616161',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default NotificationScreen;