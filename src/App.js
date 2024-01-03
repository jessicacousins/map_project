import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import busIcon from "./busIcon2.png";

function App() {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState(new Map());
  const googleMapsScript = useRef(null);

  const getBusLocations = async () => {
    const url = "https://api-v3.mbta.com/vehicles?include=trip";
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Failed to fetch bus locations:", error);
      return [];
    }
  };

  useEffect(() => {
    window.initMap = function () {
      const boston = { lat: 42.3601, lng: -71.0589 };
      const map = new window.google.maps.Map(document.getElementById("map"), {
        zoom: 13.5,
        center: boston,
        mapId: process.env.REACT_APP_MAP_ID,
      });
      setMap(map);
      setMarkers([]);
    };

    if (!window.google && !googleMapsScript.current) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      googleMapsScript.current = script;
    } else if (window.google && !googleMapsScript.current) {
      window.initMap();
    }

    return () => {
      delete window.initMap;
    };
  }, []);

  useEffect(() => {
    let localMarkers = new Map();

    const updateMarkers = async () => {
      const locations = await getBusLocations();

      locations.forEach((location) => {
        const vehicleId = location.id;
        const position = new window.google.maps.LatLng(
          location.attributes.latitude,
          location.attributes.longitude
        );

        if (localMarkers.has(vehicleId)) {
          localMarkers.get(vehicleId).setPosition(position);
        } else {
          const marker = new window.google.maps.Marker({
            position: position,
            map: map,
            icon: {
              url: busIcon,
              scaledSize: new window.google.maps.Size(30, 30),
            },
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div class="bus-info"><div>${location.attributes.label}</div><div>${location.relationships.trip.data.id}</div></div>`,
          });

          marker.addListener("click", () => infoWindow.open(map, marker));
          localMarkers.set(vehicleId, marker);
        }
      });
      setMarkers(new Map(localMarkers));
    };

    if (map) {
      updateMarkers();
      const intervalId = setInterval(updateMarkers, 15000);

      return () => {
        clearInterval(intervalId);
        localMarkers.forEach((marker) => marker.setMap(null));
        localMarkers.clear();
      };
    }
  }, [map]);

  return (
    <body className="page">
      <div className="mapArea">
        <h1 className="titleArea">MBTA Real-Time Bus Tracker</h1>
        <div id="map" style={{ width: "90vh", height: "60vh" }} />
      </div>
    </body>
  );
}

export default App;
