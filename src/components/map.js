import { useEffect, useState } from "react";

import L, { Marker, map } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./lf.css";

import styles from "./map.module.scss";

import { GrLocationPin as MarkerIcon } from "react-icons/gr";
import { renderToStaticMarkup } from "react-dom/server";

const createMap = () => {
  return L.map("map");
};

const createOSMTileLayer = () => {
  return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  });
};

const createMarker = (position) => {
  var marker = new L.Marker(position);
  var icon = L.icon({
    iconUrl: "/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
  });

  marker.setIcon(icon);

  return marker;
};

const createPin = (position, className = styles.currentPinIcon) => {
  var pin = new L.Marker(position);
  var icon = L.divIcon({
    className: className,
    iconSize: [50, 82],
    iconAnchor: [25, 62],
    html: renderToStaticMarkup(<MarkerIcon />),
  });

  pin.setIcon(icon);

  return pin;
};

const setTargetPin = (click_event, map_data) => {
  const lat = click_event.latlng.lat;
  const lng = click_event.latlng.lng;

  const updatedLatLng = new L.LatLng(lat, lng);
  var { map, pin, deployed } = map_data;

  pin.setLatLng(updatedLatLng);

  if (deployed == false) {
    pin.addTo(map);
    deployed = true;
    map.setView(updatedLatLng);
  }
};

const makeCORSRequest = async (path, method, data) => {
  var request_header = {
    method: method,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };

  if (method == "POST" && data != {})
    request_header.body = JSON.stringify(data);

  return await fetch(path, request_header);
};

const getRouteFromAPI = async (points) => {
  const response = await makeCORSRequest(
    "http://127.0.0.1:5000/router",
    "POST",
    { points: points }
  );
  return await response.json();
};

const generateShortestPath = async (from, to, map_data) => {
  var { map, polyline_ref } = map_data;

  if (polyline_ref) map.removeLayer(polyline_ref);

  var api_response = await getRouteFromAPI([from, to]);

  var { route } = api_response;

  polyline_ref = new L.polyline(route);
  polyline_ref.addTo(map);

  return polyline_ref;
};

const trasformLatLngDictToArray = (point) => {
  const latlng = point.getLatLng();
  return [latlng.lng, latlng.lat];
};

const inverseLatLng = (latlng) => {
  return [latlng[1], latlng[0]];
};

const createTwoPointPath = (map, from, to) => {
  var currentPin = createPin(from);
  currentPin.addTo(map);

  var targetPin = createPin(to, styles.flagPinIcon);
  targetPin.addTo(map);

  generateShortestPath(inverseLatLng(from), inverseLatLng(to), { map: map });
};

const addCreatePinsOnMapClick = (map) => {
  map.on("click", async (click_event) => {
    const { lat, lng } = click_event.latlng;
    createPin([lat, lng], styles.barrierPinIcon).addTo(map);
    console.log([lat, lng]);
  });
};

const getBarriers = async () => {
  const response = await makeCORSRequest(
    "http://127.0.0.1:5000/barriers",
    "GET"
  );
  return await response.json();
};

const renderBarriers = async (map) => {
  const request = await getBarriers();
  const { barriers, removed_edges } = request;

  removed_edges.map((coords_pair) => {
    const polyline = L.polyline([coords_pair],{color:"red",weight: 10});
    polyline.addTo(map);
  });

  barriers.map((coords) => {
    const barrier = createPin(coords, styles.barrierPinIcon);
    barrier.addTo(map);
  });
};

const runUnitTests = (map) => {
  addCreatePinsOnMapClick(map);

  const points = [
    [
      [44.44678683274107, 26.099503040313724],
      [44.444228561188886, 26.103816032409668],
    ],
    [
      [44.43990835130455, 26.108644008636478],
      [44.44442771209747, 26.11463069915772],
    ],
    [
      [44.433718557769936, 26.09527587890625],
      [44.428263641797066, 26.108922958374027],
    ],
  ];

  renderBarriers(map);

  points.map(([from, to]) => {
    createTwoPointPath(map, from, to);
  });
};

export default function Map(props) {
  useEffect(() => {
    // Leaflet uses the following format for cosordinates [ height/latitude,  width/longitude ]

    const initialPosition = [44.43500559853625, 26.103000640869144];
    const initialZoom = 13;

    var mapContainer = createMap().setView(initialPosition, initialZoom);
    var tileLayer = createOSMTileLayer();
    tileLayer.addTo(mapContainer);

    runUnitTests(mapContainer);

    return;

    var currentPin = createPin(initialPosition);
    currentPin.addTo(mapContainer);

    var targetPin = createPin(initialPosition, styles.flagPinIcon);
    var targetPinDeployed = false;

    var pathPolyline;

    mapContainer.on("click", async (event) => {
      setTargetPin(event, {
        map: mapContainer,
        pin: targetPin,
        deployed: targetPinDeployed,
      });

      const from = trasformLatLngDictToArray(currentPin);
      const to = trasformLatLngDictToArray(targetPin);

      pathPolyline = await generateShortestPath(from, to, {
        map: mapContainer,
        polyline_ref: pathPolyline,
      });
    });
  });

  return <div id="map" {...props} />;
}
