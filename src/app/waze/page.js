"use client";

import { useEffect } from "react";
import styles from "./waze.module.scss";

const requestWazeServers = () => {
  return fetch(
    "https://embed.waze.com/row-rtserver/web/TGeoRSS?bottom=45&left=26&ma=200&mj=200&mu=20&right=26.22608184814453&top=44.56159406873165&types=alerts%2Ctraffic",
    {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
};

const sendJamsToServer = (jams) => {
  console.log("sent jams to server");
  return fetch("http://127.0.0.1:5000/waze", {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jams: jams }),
  });
};

function WazeMap() {
  useEffect(() => {
    requestWazeServers()
      .then((res) => res.json())
      .then((json) => {
        const jams = json.jams;
        sendJamsToServer(jams);
        console.log(jams);
      });
  }, []);

  return (
    <main className={styles.main}>
      <iframe
        src="https://embed.waze.com/ro/iframe?zoom=12&lat=44.4268&lon=26.1025"
        width="100%"
        height="100%"
      ></iframe>
    </main>
  );
}

export default WazeMap;
