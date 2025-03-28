import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";
import ShowResultsScreen from "./ShowResultsScreen";

const TARGET_SPEED_KMH = 15;
const SPEED_TOLERANCE_KMH = 1;

const ACCELERATION_TRESHOLD = 0.15;

export interface SensorData {
  acceleration: { x: number; y: number; z: number };
  timestamp: number;
}

export default function SensorApp(): JSX.Element {
  const [showResults, setShowResults] = useState<boolean>(false);
  const [acceleration, setAcceleration] = useState<{
    x: number;
    y: number;
    z: number;
  }>({ x: 0, y: 0, z: 0 });
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedData, setRecordedData] = useState<SensorData[]>([]);

  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        return;
      }
    }

    getCurrentLocation();
  }, []);

  useEffect(() => {
    Accelerometer.setUpdateInterval(200);
  }, []);

  // const loadSpeed = async () => {
  //   const loc = await Location.getLastKnownPositionAsync();
    
  //   if (!loc) return;
  //   if (loc.coords.speed !== null && loc.coords.speed !== speed) {
  //     setSpeed(loc.coords.speed * 3.6);
  //   }
  // };

  useEffect(() => {
    const accelSub = Accelerometer.addListener(({ x, y, z }) => {
      setAcceleration({ x, y, z });
    });
    // setInterval(() => {
    //   loadSpeed();
    // }, 1000)
    return () => {
      accelSub.remove();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      setRecordedData((prevData) => [
        ...prevData,
        { acceleration, timestamp: Date.now() },
      ]);
    }
  }, [acceleration, isRecording]);

  if (showResults) {
    return (
      <ShowResultsScreen
        recordedData={recordedData}
        onRetry={() => {
          setShowResults(false), setRecordedData([]);
        }}
        onSave={setRecordedData}
      />
    );
  }

  const calculatedAccelerationSum = Math.sqrt(
    acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
  )

  const isAccelerationSteady = calculatedAccelerationSum < 1 + ACCELERATION_TRESHOLD && calculatedAccelerationSum > 1 - ACCELERATION_TRESHOLD
  const backgroundColor = !isRecording || isAccelerationSteady ? "green" : "red";

  const calculatedAccelerationSumString = calculatedAccelerationSum.toFixed(2)
  

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.mainContainer}>
        <Text style={styles.calculatedAccelerationSumText}>
          {calculatedAccelerationSumString}
        </Text>
        {/* <Text style={styles.calculatedAccelerationSumText}>
          {speed.toFixed(1)} km/h
        </Text> */}
      </View>
      <TouchableOpacity
        style={!!recordedData.length && !isRecording ? styles.button : styles.disabledButton}
        disabled={!(!!recordedData.length && !isRecording)}
        onPress={() => setShowResults(true)}
      >
        <Text style={styles.buttonText}>View Data</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsRecording(!isRecording)}
      >
        <Text style={styles.buttonText}>{isRecording ? "Stop" : "Record"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    backgroundColor: "#c5e3ec",
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    borderRadius: 8,
    backgroundColor: "gray",
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  mainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    padding: 20,
  },
  calculatedAccelerationSumText: {
    fontSize: 50,
    fontWeight: "bold",
  },
});
