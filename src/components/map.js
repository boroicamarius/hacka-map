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

export default function Map(props) {
  useEffect(() => {
    var mapContainer = createMap().setView([51.505, -0.09], 13);
    var tileLayer = createOSMTileLayer();

    tileLayer.addTo(mapContainer);
  });

  return <div id="map" {...props} />;
}
