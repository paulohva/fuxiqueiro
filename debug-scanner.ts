import portscanner from 'portscanner'
import https from 'https'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

async function testPortScan(ip: string) {
  console.log(`Scanning ports for ${ip}...`)
  // Common ports + some extras that might be on a LAN device
  const ports = [
    21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 631, 993, 995, 
    3000, 3306, 3389, 5000, 5900, 8000, 8008, 8009, 8080, 8443, 9000, 9090
  ]
  for (const port of ports) {
    try {
      // @ts-ignore
      const status = await portscanner.checkPortStatus(port, ip, { timeout: 2000 })
      console.log(`Port ${port}: ${status}`)
    } catch (e) {
      console.error(`Error scanning port ${port}:`, e)
    }
  }
}

async function testVendorLookup(mac: string) {
  console.log(`Looking up vendor for ${mac}...`)
  try {
    // @ts-ignore
    const ouiData = require('oui-data')
    const macClean = mac.replace(/[^0-9a-f]/gi, '').toUpperCase().substring(0, 6)
    const vendor = ouiData[macClean]
    console.log(`Local lookup result: ${vendor}`)
  } catch (e) {
    console.error('Local lookup failed:', e)
  }

  console.log('Testing online lookup...')
  try {
    const onlineVendor = await new Promise((resolve, reject) => {
      https.get(`https://api.macvendors.com/${mac}`, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => resolve(data.trim()))
      }).on('error', reject)
    })
    console.log(`Online lookup result: ${onlineVendor}`)
  } catch (e) {
    console.error('Online lookup failed:', e)
  }
}

async function main() {
  // Target the specific IP reported by the user
  await testPortScan('192.168.1.70')
  
  // Use a known MAC address (e.g., Apple)
  // await testVendorLookup('00:1C:42:00:00:00') // Parallels
  // await testVendorLookup('bc:d0:74:00:00:00') // Example
}

main()
