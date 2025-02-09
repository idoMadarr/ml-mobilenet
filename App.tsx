import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import '@tensorflow/tfjs-react-native';
import {decodeJpeg, fetch as tsFetch} from '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';

// Image (URI) → Base64 → Buffer → Uint8Array → Tensor → model.classify(tensor) → Predictions

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    initTensorflow();
  }, []);

  const initTensorflow = async () => {
    await tf.ready();
    console.log('FETCH ', tsFetch);
    const model = await initMobileNetModle();
    setModel(model);
    setIsLoading(false);
  };

  const initMobileNetModle = async () => {
    try {
      const model = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      });
      console.log('Model Loaded Successfully');
      return model;
    } catch (error) {
      Alert.alert('Error', JSON.stringify(error));
      return null;
    }
  };

  const ImageToTensor = async (uri: string) => {
    setIsLoading(true);
    try {
      if (model) {
        const imageBase64 = await RNFS.readFile(uri, 'base64'); // Read as base64
        const imageBuffer = Buffer.from(imageBase64, 'base64'); // Convert base64 to buffer
        const uint8Array = new Uint8Array(imageBuffer); // Convert to Uint8Array
        const imageTensor = decodeJpeg(uint8Array); // Convert to Tensor
        const predictions = await model.classify(imageTensor); // Classify image tensor

        setPrediction(predictions);
        setIsLoading(false);
        return;
      }
      Alert.alert('Ops!', 'Something Went Worng');
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', JSON.stringify(error));
    }
  };

  const pickImage = async () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.assets) {
        const image = response.assets[0];
        if (image.uri) {
          setImageUri(image.uri);
          ImageToTensor(image.uri);
        }
      }
    });
  };

  const openCamera = async () => {
    launchCamera({mediaType: 'photo'}, response => {
      if (response.assets) {
        const image = response.assets[0];
        if (image.uri) {
          setImageUri(image.uri);
          ImageToTensor(image.uri);
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle={'dark-content'} backgroundColor={'white'} />
      <Text style={styles.title}>{'Tesorflow!'}</Text>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonTitle}>pick libarary pic</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={openCamera}>
        <Text style={styles.buttonTitle}>open camera</Text>
      </TouchableOpacity>

      {prediction && (
        <View>
          {prediction.map((item: {className: 'string'}, index: number) => {
            return <Text key={index}>{item.className || 'none'}</Text>;
          })}
          <Image
            source={{uri: imageUri as string}}
            resizeMode={'cover'}
            style={styles.image}
          />
        </View>
      )}
      {isLoading && (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size={'large'} color={'white'} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    width: '80%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
    padding: 10,
    margin: 10,
  },
  buttonTitle: {
    color: 'white',
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 250,
  },
  spinnerContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#000000aa',
  },
});

export default App;
