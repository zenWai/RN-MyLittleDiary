import PlaceForm from "../components/Places/PlaceForm";
import {downloadAndSavePOIPhoto, getMaxPOIResultsSetting, insertPlace} from "../util/database";
import {getAddress, getNearbyPointsOfInterest} from "../util/location";
import {useState} from "react";
import {ActivityIndicator, Alert, StyleSheet, View} from "react-native";
import {Colors} from "../constants/colors";

function AddPlace({ navigation }) {
    const [isLoading, setIsLoading] = useState(false);

    // Results of extracted POIS for that location

    async function createPlaceHandler(place) {
        setIsLoading(true);
        try {
            const infoFromLocation = await getAddress(place.location.lat, place.location.lng);
            const address = infoFromLocation.address;
            const country = infoFromLocation.country;
            const countryCode = infoFromLocation.countryCode;
            console.log('countryCode', countryCode);
            const city = infoFromLocation.city;
            if(!city || !country) {
                Alert.alert(
                    'Location not found or too rural',
                    'You can pick a nearby location on your map'
                );
                return;
            }
            const maxResults = await getMaxPOIResultsSetting();
            console.log('maxResults', maxResults)
            const nearbyPOIS = await getNearbyPointsOfInterest(place.location.lat, place.location.lng, maxResults);
            console.log(nearbyPOIS)
            const poiPhotoPaths = [];
            for (let poi of nearbyPOIS) {
                if (poi.photo_reference) {
                    const path = await downloadAndSavePOIPhoto(poi.photo_reference);
                    poiPhotoPaths.push(path);
                }
            }


            const newPlace = {
                ...place,
                address,
                country,
                countryCode,
                city,
                nearbyPOIS,
                poiPhotoPaths
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