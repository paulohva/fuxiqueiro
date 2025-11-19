import find from 'local-devices'
import portscanner from 'portscanner'
import { promisify } from 'util'

import dns from 'dns'
import https from 'https'
import oui from 'oui-data'

const reverseDns = promisify(dns.reverse)
const lookupService = promisify(dns.lookupService)

export interface PortInfo {
  port: number
  description: string
}

export interface Device {
  ip: string
  mac: string
  name?: string
  vendor?: string
  os?: string
  ports?: PortInfo[]
  hostname?: string
  type?: string
}

const PORT_DESCRIPTIONS: Record<number, string> = {
  21: 'FTP (File Transfer)',
  22: 'SSH (Secure Shell)',
  23: 'Telnet',
  25: 'SMTP (Email)',
  53: 'DNS',
  80: 'HTTP (Web)',
  110: 'POP3 (Email)',
  135: 'RPC',
  139: 'NetBIOS',
  143: 'IMAP (Email)',
  443: 'HTTPS (Secure Web)',
  445: 'SMB (File Sharing)',
  631: 'IPP (Printing)',
  993: 'IMAP SSL',
  995: 'POP3 SSL',
  3306: 'MySQL',
  3389: 'RDP (Remote Desktop)',
  5000: 'UPnP / AirPlay',
  5900: 'VNC (Remote Access)',
  8000: 'HTTP Alt',
  8008: 'Chromecast',
  8009: 'Cast',
  8080: 'HTTP Proxy',
  8443: 'HTTPS Alt'
}

export class ScannerService {
  async scanNetwork(): Promise<Device[]> {
    try {
      const devices = await find()
      
      // Process devices sequentially for vendor lookup to respect rate limits if needed, 
      // but we can do local lookups in parallel.
      const enrichedDevices = []
      
      for (const device of devices) {
        let vendor = 'Unknown'
        try {
          // oui-data is a large object mapping OUI to vendor
          const macClean = device.mac.replace(/[^0-9a-f]/gi, '').toUpperCase().substring(0, 6)
          // @ts-ignore
          const ouiVendor = oui[macClean]
          if (ouiVendor) {
            vendor = ouiVendor.split('\n')[0]
          }
        } catch (e) {
          // Local lookup failed
        }

        if (!vendor || vendor === 'Unknown') {
          try {
            // Add a small delay to avoid hitting rate limits too hard if we have many unknowns
            await new Promise(r => setTimeout(r, 1100)) 
            vendor = await this.fetchVendorOnline(device.mac)
          } catch (e) {
            // Online lookup failed
          }
        }

        let hostname = undefined
        try {
          const hostnames = await reverseDns(device.ip)
          if (hostnames && hostnames.length > 0) {
            hostname = hostnames[0]
          }
        } catch (e) {
          // Ignore reverse DNS errors
        }

        if (!hostname) {
          try {
            // Fallback to lookupService (getnameinfo)
            const result = await lookupService(device.ip, 0)
            if (result && result.hostname) {
              hostname = result.hostname
            }
          } catch (e) {
            // Ignore lookupService errors
          }
        }

        enrichedDevices.push({
          ip: device.ip,
          mac: device.mac,
          name: device.name === '?' ? undefined : device.name,
          vendor: vendor,
          hostname: hostname,
          // ports is undefined initially to distinguish from "scanned but found none"
        })
      }
      
      return enrichedDevices
    } catch (error) {
      console.error('Network scan failed:', error)
      return []
    }
  }

  async fetchVendorOnline(mac: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(`https://api.macvendors.com/${mac}`, (res) => {
        if (res.statusCode !== 200) {
          // Consume data to free memory
          res.resume()
          reject(new Error(`Request failed with status code ${res.statusCode}`))
          return
        }
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => resolve(data.trim()))
      }).on('error', (err) => reject(err))
    })
  }

  async scanPorts(ip: string): Promise<PortInfo[]> {
    console.log(`Scanning ports for ${ip}...`)
    const commonPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 631, 993, 995, 3306, 3389, 5000, 5900, 8000, 8008, 8009, 8080, 8443]
    const openPorts: PortInfo[] = []

    // Scan ports in batches to avoid overwhelming the network/device
    const batchSize = 5
    for (let i = 0; i < commonPorts.length; i += batchSize) {
      const batch = commonPorts.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (port) => {
          try {
            // Add timeout option (default is usually 400ms, increasing to 2000ms)
            const status = await portscanner.checkPortStatus(port, ip, { timeout: 2000 })
            if (status === 'open') {
              console.log(`Port ${port} is open on ${ip}`)
              openPorts.push({
                port,
                description: PORT_DESCRIPTIONS[port] || 'Unknown Service'
              })
            }
          } catch (e) {
            console.error(`Error scanning port ${port} on ${ip}:`, e)
          }
        })
      )
    }
    
    console.log(`Scan complete for ${ip}. Found ${openPorts.length} open ports.`)
    return openPorts.sort((a, b) => a.port - b.port)
  }
  
  getDeviceType(ports: PortInfo[], vendor: string): string {
    const portNumbers = ports.map(p => p.port)
    if (portNumbers.includes(631)) return 'Printer'
    if (portNumbers.includes(5000)) return 'Media Device' // AirPlay often uses 5000
    if (portNumbers.includes(22)) return 'Server/Linux'
    if (portNumbers.includes(3389)) return 'Windows PC'
    if (portNumbers.includes(80) || portNumbers.includes(443) || portNumbers.includes(8080)) return 'Web Server'
    
    if (vendor.toLowerCase().includes('apple')) return 'Apple Device'
    if (vendor.toLowerCase().includes('intel')) return 'PC'
    
    return 'Unknown Device'
  }
}
