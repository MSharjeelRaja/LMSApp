import {StyleSheet, Text, View, Image, ScrollView} from 'react-native';
import React from 'react';
import {Navbar} from '../ControlsAPI/Comps';

const Details = ({navigation, route}) => {
  const userData = route.params.userData;
  const formattedDate = userData['Date Of Birth']
    .split('-')
    .reverse()
    .join('-');
  return (
    <View style={styles.container}>
      <Navbar
        title="LMS"
        userName={userData.name}
        des={'Junior Lecturer'}
        showBackButton={true}
        onLogout={() => navigation.replace('Login')}
      />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileSection}>
          <Image source={{uri: userData.image}} style={styles.profileImage} />
          <Text style={styles.nameText}>{userData.name}</Text>

          <View style={styles.detailsContainer}>
            <DetailRow
              label="Date of Birth"
              value={userData['Date Of Birth'].split('-').reverse().join('-')}
            />
            <DetailRow label="Session" value={userData.Session} />
            <DetailRow label="Username" value={userData.Username} />
            <DetailRow label="Gender" value={userData.gender} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const DetailRow = ({label, value}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default Details;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  contentContainer: {
    paddingVertical: 30,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#2a4d69',
    marginBottom: 20,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2a4d69',
    marginBottom: 30,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#4b86b4',
    fontWeight: '600',
    width: 120,
  },
  detailValue: {
    fontSize: 16,
    color: '#2a4d69',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});
