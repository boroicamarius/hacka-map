import { useEffect, useState } from "react";

import L, { map } from "leaflet";
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

const createCurrentPosMarker = (position) => {
  var marker = new L.Marker(position);
  var icon = L.icon({
    iconUrl: "/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
  });

  marker.setIcon(icon);

  return marker;
};

export default function Map(props) {
  useEffect(() => {
    // Leaflet uses the following format for cosordinates [ height/latitude,  width/longitude ]

    const initialPosition = [51.505, -0.09];
    const initialZoom = 13;

    var mapContainer = createMap().setView(initialPosition, initialZoom);
    var tileLayer = createOSMTileLayer();
    tileLayer.addTo(mapContainer);

    var currentPositionMarker = createCurrentPosMarker(initialPosition);
    currentPositionMarker.addTo(mapContainer);
  });

  return <div id="map" {...props} />;
}
