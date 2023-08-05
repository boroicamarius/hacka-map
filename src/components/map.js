import { useEffect, useState } from "react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./lf.css";

import styles from "./map.module.scss";

import { GrLocationPin as StartIcon } from "react-icons/gr";
import { GrLocationPin as FlagIcon } from "react-icons/gr";

import { renderToStaticMarkup } from "react-dom/server";

async function triggerChange(map, start, end,barriers) {
  console.log(`ROUTE FROM: ${start}->${end}`);

  const res = await fetch(`http://127.0.0.1:5000/router`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      points: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
      barriers: barriers
    }),
  });

  var all_coords = await res.json();

  var new_polyline = new L.Polyline(all_coords, {
    color: "red",
    weight: 3,
    opacity: 0.5,
    smoothFactor: 1,
  });

  new_polyline.addTo(map);

  return new_polyline;
}

export default function Map(props) {
  useEffect(() => {
    var currentPos = [51.505, -0.09];
    var targetPos = [];
    var map = L.map("map").setView([51.505, -0.09], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const CarIcon_multiplier = 3;
    const CarIcon = new L.divIcon({
      className: styles.carIcon,
      iconSize: [45, 60],
      iconAnchor: [22.5, 50],
      html: renderToStaticMarkup(<StartIcon />),
    });

    const BarrierIcon = new L.divIcon({
      className: styles.barrierIcon,
      iconSize: [45, 60],
      iconAnchor: [22.5, 50],
      html: renderToStaticMarkup(<StartIcon />),
    });

    var polyline = undefined;
    var TargetLocationMarker = undefined;
    var CarMarker = new L.Marker(currentPos);
    CarMarker.setIcon(CarIcon).addTo(map);
    CarMarker.dragging.enable();

    var barrierCoords = []
    var barriers = []

    console.log("START: " + CarMarker.getLatLng());

    CarMarker.on("dragend", (e) => {
      const markerGeoPosition = e.target.getLatLng();
      const vectorPosition = [markerGeoPosition.lat, markerGeoPosition.lng];
      CarMarker.setLatLng(vectorPosition);
      currentPos = vectorPosition;
      map.setView(currentPos);
      console.log("START: " + CarMarker.getLatLng());
      if(polyline!=undefined) polyline.removeFrom(map);
      if (TargetLocationMarker)
        triggerChange(
          map,
          CarMarker.getLatLng(),
          TargetLocationMarker.getLatLng(),
          barrierCoords
        ).then((res) => {
          polyline = res;
        });
    });

    const TargetIcon = new L.divIcon({
      className: styles.flagIcon,
      iconSize: [45, 60],
      iconAnchor: [22.5, 50],
      html: renderToStaticMarkup(<FlagIcon />),
    });

    map.on("click", (e) => {
      const clickLatLng = e.latlng;
      const vectorLatLng = [clickLatLng.lat, clickLatLng.lng];

      if (TargetLocationMarker == undefined) {
        TargetLocationMarker = new L.Marker(vectorLatLng);
        TargetLocationMarker.setIcon(TargetIcon);
        TargetLocationMarker.addTo(map);
      } else TargetLocationMarker.setLatLng(vectorLatLng);
      console.log("END: " + TargetLocationMarker.getLatLng());

      while (barriers.length > 0) {barriers.pop().removeFrom(map),barrierCoords.pop()}

      for(let barrier_num=1;barrier_num<=100;++barrier_num){

        const barriersOffset = 0.02;
        const modifiedLatLng = [vectorLatLng[0]+barriersOffset*Math.random()-barriersOffset/2,vectorLatLng[1]+barriersOffset*Math.random()-barriersOffset/2]

        barrierCoords.push([modifiedLatLng[1],modifiedLatLng[0]])
        barriers.push(new L.Marker(modifiedLatLng).setIcon(BarrierIcon).addTo(map))
      }

      if(polyline!=undefined) polyline.removeFrom(map);
      triggerChange(
        map,
        CarMarker.getLatLng(),
        TargetLocationMarker.getLatLng(),
        barrierCoords
      ).then((res) => {
        polyline = res;
      });
    });
  });
  return <div id="map" {...props} />;
}
