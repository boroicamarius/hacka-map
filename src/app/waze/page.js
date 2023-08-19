"use client";

import styles from "./waze.module.scss";

function WazeMap() {
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
