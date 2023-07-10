import {ActivityIndicator, Alert, Image, Linking, Platform, StyleSheet, Text, View} from "react-native";
import {launchCameraAsync, PermissionStatus, useCameraPermissions} from "expo-image-picker";
import {useState} from "react";
import {Colors} from "../../constants/colors";
import OutlinedButton from "../UI/OutlinedButton";

function ImagePicker({ onImageTaken }) {
    const [cameraPermissionInformation, requestPermission] = useCameraPermissions();
    const [pickedImage, setPickedImage] = useState();
    const [loadingPicture, setLoadingPicture] = useState(false);

    async function verifyPermissions() {
        if (cameraPermissionInformation.status === PermissionStatus.UNDETERMINED) {
            const permissionResponse = await requestPermission();
            return permissionResponse.granted;
        }

        function openSettings() {
            Linking.openSettings();
        }

        if (cameraPermissionInformation.status === PermissionStatus.DENIED) {
            Alert.alert(
                'Insufficient Permissions',
                'You need to grant camera permissions to use this app',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Open Settings',
                        onPress: () => openSettings(),
                    },
                ]
            );
            return false;
        }

        return true;
    }

    async function takeImageHandler() {
        const hasPermission = await verifyPermissions();
        if (!hasPermission) {
            return;
        }

        setLoadingPicture(true);
        const image = await launchCameraAsync({
            /*
             * Disable Expo cropping functionality,
             * considering react-native-image-crop-picker instead
             * crop function is faulty
             */
            allowsEditing: Platform.OS === 'android',
            quality: 1,
        });

        try {
            if (!image.canceled) {
                setPickedImage(image.assets);
                onImageTaken(image.assets);
            }
        } catch (error) {
            console.log('error taking picture', error);
        } finally {
            setLoadingPicture(false);
        }

    }

    let imagePreview = <Text>No image taken yet.</Text>;

    if (pickedImage) {
        imagePreview = <Image style={styles.image} source={{ uri: pickedImage[0].uri }} resizeMode="stretch"/>;
    }
    return (
        <View>
            <View style={styles.imagePreview}>
                {loadingPicture
                    ? (
                        <ActivityIndicator size="large" color={Colors.primary500}/>
                    )
                    : (imagePreview)
                }
            </View>
            <OutlinedButton icon="camera" onPress={takeImageHandler}>Take Photo</OutlinedButton>
        </View>
    );
}

export default ImagePicker;

const styles = StyleSheet.create({
    imagePreview: {
        width: '100%',
        height: 200,
        marginVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary100,
        borderRadius: 4,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    }
})