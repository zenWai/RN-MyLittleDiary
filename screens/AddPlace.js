import PlaceForm from "../components/Places/PlaceForm";
import {downloadAndSavePOIPhoto, getMaxPOIResultsSetting, insertPlace} from "../util/database";
import {getAddress, getNearbyPointsOfInterest} from "../util/location";
import {useState} from "react";
import {ActivityIndicator, Alert, StyleSheet, View} from "react-native";
import {Colors} from "../constants/colors";
import * as FileSystem from 'expo-file-system';
import {InterestingFacts} from "../util/InterestingFacts";
import {showMessage} from "react-native-flash-message";

function AddPlace({ navigation }) {
    const [isLoading, setIsLoading] = useState(false);

    async function createPlaceHandler(place) {
        setIsLoading(true);
        try {
            const infoFromLocation = await getAddress(place.location.lat, place.location.lng);
            const address = infoFromLocation.address;
            const country = infoFromLocation.country;
            const countryCode = infoFromLocation.countryCode;
            const city = infoFromLocation.city;
            // Same alert before getting a location from map,
            // But this will fire if location on photo is not recognized by getAddress // will it ever happen?
            if (!city || !country) {
                Alert.alert(
                    'Location Unavailable',
                    'The selected location was not found or it may be too remote. Please choose a location closer to a city or town.'
                );
                return;
            }
            const maxResults = await getMaxPOIResultsSetting();
            const nearbyPOIS = await getNearbyPointsOfInterest(place.location.lat, place.location.lng, maxResults);
            const interestingFact = await InterestingFacts(city, country);
            const poiPhotoPaths = [];
            for (let poi of nearbyPOIS) {
                if (poi.photo_reference) {
                    const path = await downloadAndSavePOIPhoto(poi.photo_reference);
                    poiPhotoPaths.push(path);
                }
            }
            const newImageUri = FileSystem.documentDirectory + place.imageUri.split('/').pop();
            await FileSystem.copyAsync({
                from: place.imageUri,
                to: newImageUri,
            });
            place.imageUri = newImageUri;

            const newPlace = {
                ...place,
                address,
                country,
                countryCode,
                city,
                nearbyPOIS,
                poiPhotoPaths,
                interestingFact,
            };
            await insertPlace(newPlace);
            navigation.navigate('AllPlaces');
        } catch (error) {
            console.log('Error creating place:', error);
            Alert.alert(
                error,
                'Error occurred while creating the place, please try again',
                [{ text: 'Okay' }]
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        isLoading
            ?
            (
                <View style={styles.activityIndicator}>
                    <ActivityIndicator size="large" color={Colors.primary500}/>
                </View>
            )
            : <PlaceForm onCreatePlace={createPlaceHandler}/>
    );
}

export default AddPlace;

const styles = StyleSheet.create({
    activityIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});