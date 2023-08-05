import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HackA-Map',
  description: 'Made for InfoEducatie',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{margin:0,overflowX:'hidden'}}>{children}</body>
    </html>
  )
}
