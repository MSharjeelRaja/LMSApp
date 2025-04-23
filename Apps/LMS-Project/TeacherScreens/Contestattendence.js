import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { Card, Button, IconButton } from 'react-native-paper';
import { API_URL, Navbar } from '../ControlsAPI/Comps'; // Changed Navbars to Navbar
import { useAlert } from '../ControlsAPI/alert';
import colors from '../ControlsAPI/colors';
import { useNavigation } from '@react-navigation/native'; // Added for navigation

const { width } = Dimensions.get('window');

const ContestListScreen = ({ navigation, route }) => {
  const [contests, setContests] = useState([]);
  const [filteredContests, setFilteredContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const alertContext = useAlert();
  const Tid = global.Tid;
  const userData = route.params?.userData || {}; // Added fallback empty object

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/Teachers/contest-list?teacher_id=${Tid}`);
      const data = await response.json();
      if (data.success) {
        setContests(data['Student Contested Attendace']);
        setFilteredContests(data['Student Contested Attendace']);
      }
    } catch (error) {
      alertContext.showAlert('error', 'Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text === '') {
      setFilteredContests(contests);
    } else {
      const filtered = contests.filter(contest => 
        contest['Student Name'].toLowerCase().includes(text.toLowerCase()) ||
        contest['Student Reg NO'].toLowerCase().includes(text.toLowerCase())
      );
      setFilteredContests(filtered);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredContests(contests);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchContests();
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleProcessContest = async (verification) => {
    if (!selectedContest) return;

    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/Teachers/process-contest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification: verification,
          contest_id: selectedContest.contested_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        alertContext.showAlert('success', `Contest ${verification} successfully`);
        fetchContests();
      } else {
        alertContext.showAlert('error', data.message || 'Failed to process contest');
      }
    } catch (error) {
      alertContext.showAlert('error', 'Network error');
      console.error(error);
    } finally {
      setProcessing(false);
      setModalVisible(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item['Student Name']}</Text>
            <Text style={styles.regNo}>{item['Student Reg NO']}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            item.Status === 'Pending' ? styles.pendingStatus : 
              (item.Status === 'Approved' ? styles.approvedStatus : styles.rejectedStatus)
          ]}>
            <Text style={styles.statusText}>{item.Status}</Text>
          </View>
        </View>

        <View style={styles.detailContainer}>
          <View style={styles.detailRow}>
            <IconButton icon="book" size={16} color="#1E88E5" />
            <Text style={styles.detailValue}>{item.Course}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <IconButton icon="calendar" size={16} color="#1E88E5" />
            <Text style={styles.detailValue}>{item['Date & Time']}</Text>
          </View>
        </View>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button
          mode="contained"
          onPress={() => {
            setSelectedContest(item);
            setModalVisible(true);
          }}
          style={styles.reviewButton}
          labelStyle={styles.buttonLabel}
          icon="eye"
        >
          Review
        </Button>
      </Card.Actions>
    </Card>
  );

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <IconButton icon={icon} size={18} color="#1E88E5" />
      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  try {
    return (
      <View style={styles.container}>
       <Navbar
  title="LMS"
  userName={userData?.name || ''}
  des={'Teacher'}
  onLogout={() => navigation.replace('Login')}
  showBackButton={true}  // or false to hide the back button
/>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or reg no..."
            placeholderTextColor="#90A4AE"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <IconButton icon="close" size={20} color="#1E88E5" />
            </TouchableOpacity>
          ) : (
            <IconButton icon="magnify" size={20} color="#1E88E5" />
          )}
        </View>

        {filteredContests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconButton icon="alert-circle-outline" size={48} color="#90A4AE" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching results found' : 'No contested attendances found'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredContests}
            renderItem={renderItem}
            keyExtractor={(item) => item.contested_id.toString()}
            contentContainerStyle={styles.listContainer}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1E88E5']}
                
              />
            }
          />
        )}

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => !processing && setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Attendance Review</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                  disabled={processing}
                >
                  <IconButton icon="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.studentInfoContainer}>
                <Text style={styles.modalStudentName}>
                  {selectedContest?.['Student Name']}
                </Text>
                <Text style={styles.modalRegNo}>
                  {selectedContest?.['Student Reg NO']}
                </Text>
              </View>

              <View style={styles.detailsContainer}>
                <DetailRow icon="book" label="Course" value={selectedContest?.Course} />
                <DetailRow icon="calendar" label="Date" value={selectedContest?.['Date & Time']} />
                <DetailRow icon="map-marker" label="Venue" value={selectedContest?.Venue} />
              </View>

              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  style={styles.approveButton}
                  labelStyle={styles.buttonLabel}
                  onPress={() => handleProcessContest('Accepted')}
                  loading={processing}
                  disabled={processing}
                  icon="check"
                >
                  Approve
                </Button>
                <Button
                  mode="outlined"
                  style={styles.rejectButton}
                  labelStyle={styles.rejectLabel}
                  onPress={() => handleProcessContest('Rejected')}
                  disabled={processing}
                  icon="close"
                >
                  Reject
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  } catch (error) {
    console.error('Render error:', error);
    return (
      <View style={styles.center}>
        <Text>Something went wrong. Please try again.</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 8,
    elevation: 4,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: '#37474F',
  },
  card: {
    margin: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    elevation: 4,
    shadowColor: '#1E88E5',
    
  },
  cardContent: {
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#263238',
  },
  regNo: {
    fontSize: 14,
    color: '#78909C',
    marginTop: 4,
  },
  detailContainer: {
    marginTop: 7,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    
  },
  detailValue: {
    fontSize: 14,
    color: '#37474F',
   
  },
  statusBadge: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  pendingStatus: {
    backgroundColor: '#FFA000',
  },
  approvedStatus: {
    backgroundColor: '#4CAF50',
  },
  rejectedStatus: {
    backgroundColor: '#F44336',
  },
  cardActions: {
    justifyContent: 'flex-end',
    padding: 8,
  },
  reviewButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#90A4AE',
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.63)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 8,
    
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 6,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,marginLeft:10,
    fontWeight: '600',
  },
  closeButton: {
    marginRight: -10,
  },
  studentInfoContainer: {
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor:' rgba(84, 84, 84, 0.25)',
  },
  modalStudentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#263238',
  },
  modalRegNo: {
    fontSize: 14,
    color: '#78909C',
    marginTop: 4,
  },
  detailsContainer: {
    padding: 16,
  },
  detailTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  detailLabel: {
    color: '#78909C',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    marginRight: 8,
    elevation: 2,
  },
  rejectButton: {
    flex: 1,
    borderColor:colors.red1,
    backgroundColor:colors.red1,
    borderRadius: 8,
  },
  rejectLabel: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 16,
  },
});

export default ContestListScreen;