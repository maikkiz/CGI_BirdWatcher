import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView,  Alert } from 'react-native';
import { Header, Button, Input, ListItem } from 'react-native-elements';
import RNPickerSelect from 'react-native-picker-select';
import * as SQLite from 'expo-sqlite';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/EvilIcons';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';

export default function App() {

  //setting up hooks
  const [species, setSpecies] = useState('');
  const [rarity, setRarity] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(null);
  const [observations, setObservations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [longitude, setLongitude] = useState(null);
  const [latitude, setLatitude] = useState(null);

  //opening the database
  const db = SQLite.openDatabase('observationsdb.db');

  //creating the database in useEffect hooks by using tx.executeSql method
  React.useEffect(() => {
    db.transaction(tx  => {
      tx.executeSql('create table if not exists observation (id integer primary key not null, species text, notes text, rarity text, timestamp text, longitude integer, latitude integer);');
    });
    updateList();
    getLocation();
    getTimestamp();
  }, []);

  //getting the location on whitch the observation is made
  //checking the devices permissions on accessing location information
  //setting the coordinates using JSON.stringify
  const getLocation = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      Alert.alert('No permission to access location');
    }
    else {
      let location = await Location.getCurrentPositionAsync({});
      setLongitude(JSON.stringify(location.coords.longitude));
      setLatitude(JSON.stringify(location.coords.latitude));
    }
  };

  //getting the date and time in whitch the observation is made
  const getTimestamp = () => {
    var date = new Date().getDate();        //Current Date
    var month = new Date().getMonth() + 1;  //Current Month
    var year = new Date().getFullYear();    //Current Year
    var hours = new Date().getHours();      //Current Hours
    var min = new Date().getMinutes();      //Current Minutes

    if (min < 10) {
      setTimestamp(date + '.' + month + '.' + year + ' ' + hours + ':0' + min);
    }
    else {
      setTimestamp(date + '.' + month + '.' + year + ' ' + hours + ':' + min);
    }
  };

  //method for opening and closing modal
  //also empties the inputs
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
    setSpecies('');
    setRarity('');
    setNotes('');
  };

  //creating the save funktion that saves the observation onPress
  //calling the getTimestamp and getLocation methods for saving the date and time and coordinates of the observation
  //calling the updateList method for rerendering the list
  const saveObservation = async () => {
    await getLocation();
    getTimestamp();
  
    db.transaction(tx => {
      tx.executeSql('insert into observation (species, notes, rarity, timestamp, longitude, latitude) values (?, ?, ?, ?, ?, ?);',
      [species, notes, rarity, timestamp, longitude, latitude]);
      toggleModal();
    }, null, updateList
    )
  };

  //method fetches all observations from the table for updating and rerendering the list
  const updateList = () => {
    db.transaction(tx => {
      tx.executeSql('select * from observation;', [], (_, { rows }) =>
      setObservations(rows._array)
      );
    });
  };

  //method for deleting observation from the list
  const deleteObservation = (id) => {
    db.transaction(tx => {
      tx.executeSql('delete from observation where id = ?;', [id]);}, 
      null, updateList
    )
  };

  //creating the placeholder for the picker
  const placeholder = {
    label: 'Select rarity...',
    value: null,
    color: '#9EA0A4',
    marginLeft: 10
  };

  //creating the items for the picker
  const pickerItems = [
    {
      label: 'Common',
      value: 'Common',
    },
    {
      label: 'Rare',
      value: 'Rare',
    },
    {
      label: 'Extremely rare',
      value: 'Extremely rare',
    },
  ];
 
  //creating a copy of the original observations list and sorting it
  const sortedList = observations.slice().sort((a, b) => b.id - a.id);
  
  return (
    <View style={styles.container}>
      <Header
        containerStyle={{
          backgroundColor: '#006666'
        }}
        centerComponent={{ 
          text: 'Bird Watcher', 
          style: { color: '#fff', fontSize: 30 }
        }}
      />
      <ScrollView>
        <Text style={{textAlign: 'center', fontSize: 25, marginTop: 10}}>List of observations </Text>
        {
          sortedList.map((bird, index) => (
            <ListItem
              key={index}
              title={
              <View>
                <Text style={{fontWeight: 'bold', fontSize:18}}>Species: {bird.species}</Text>
                </View>
                }
              subtitle={
                <View>
                  <Text style={{fontSize: 15}}>Notes: {bird.notes}</Text>
                  <Text style={{fontSize: 15}}>Rarity: {bird.rarity}</Text>
                  <Text style={{fontSize: 15}}>Date and time: {bird.timestamp}</Text>
                  <Text style={{fontSize: 15}}>Longitude: {bird.longitude}</Text>
                  <Text style={{fontSize: 15}}>Latitude: {bird.latitude}</Text>
                </View>
              }
              rightIcon={
                <Icon
                  name='close'
                  color='grey'
                  size={30}
                  onPress={() => Alert.alert('Are you sure you want to delete this observation?', '',
                  [
                    {text: 'Cancel', onPress: () => console.log('Deletion cancelled'), style: 'cancel'},
                    {text: 'Delete', onPress: () => {deleteObservation(bird.id)}},
                  ],
                  { cancelable: false }
                  )}
                />
              }
              bottomDivider
            />
          ))
        }
      </ScrollView>  

      <Button 
        type="outline" 
        onPress={toggleModal}       
        buttonStyle={{
          marginTop: 20,
          marginBottom: 10,
          marginRight: 10,
          marginLeft:10,
          borderColor: 'grey',
        }}
        titleStyle={{
          color: 'grey',
          fontSize: 18
        }}
        title="Add observation" 
      />
      
      <Modal isVisible={isModalVisible}>
        <View style={{ 
          backgroundColor: "#fff",
          marginTop: 25,
          borderRadius: 5 
        }}>
          <Text style={{fontSize: 22, textAlign: 'center', marginTop: 10}}>Add new observation </Text>
          <Input
            placeholder='Species'
            onChangeText={species => setSpecies(species)}
            value={species}
          />

          <View style={{marginBottom: 8}}>
            <Input
              multiline={true}
              placeholder='Notes'
              onChangeText={notes => setNotes(notes)}
              value={notes}
            />
          </View>

          <RNPickerSelect
            placeholder={placeholder}
            onValueChange={rarity => setRarity(rarity)}
            useNativeAndroidPickerStyle={false}
            textInputProps={{ 
              underlineColorAndroid: 'grey', 
              fontSize: 20, 
              paddingBottom: 11, 
              marginLeft: 6, 
              marginRight: 6, 
              paddingLeft: 5 }}
              items={pickerItems}
          />
          <Text style={{fontSize:16, marginTop: 5, marginLeft: 15}}>On save the app will also record date & time and coordinates.</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 15}}>
            <Button 
              type="outline" 
              onPress={toggleModal}       
              buttonStyle={{
                marginTop: 20, 
                borderColor: 'red',
                width: 100
              }}
              titleStyle={{
                color: 'red',
                fontSize: 18
              }}
              title="Cancel" 
            />
           
            <Button 
              type="outline" 
              onPress={saveObservation}   
              buttonStyle={{
                marginTop: 20,
                borderColor: 'green',
                width: 100
              }}
              titleStyle={{
                color: 'green',
                fontSize: 18
              }}
              title="Save" 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});

