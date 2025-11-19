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
