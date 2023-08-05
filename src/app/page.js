'use client';

import Image from 'next/image'
import styles from './hub.module.scss'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

function HomePage() {

  const Map = useMemo(()=>dynamic(
    () => import('src/components/map'),
    { 
      loading: () => <p>A map is loading</p>,
      ssr: false 
    }
  ),[])


  return (
    <main className={styles.main}>
      <Map className={styles.map} />
    </main>
  )
}

export default HomePage;

