import React from 'react'
import { Device } from '../types/device'

interface DeviceListProps {
  devices: Device[]
  onSelectDevice: (device: Device) => void
  scanning: boolean
}

export const DeviceList: React.FC<DeviceListProps> = ({ devices, onSelectDevice, scanning }) => {
  return (
    <div className="space-y-4 p-4">
      {devices.length === 0 && !scanning && (
        <div className="border-2 border-black p-4 bg-white shadow-neo text-center font-bold">
          No devices found. Start a scan to discover devices.
        </div>
      )}
      {devices.map((device, index) => (
        <div 
          key={device.mac} 
          onClick={() => onSelectDevice(device)} 
          className={`cursor-pointer border-4 border-black bg-white p-4 shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 group relative overflow-hidden`}
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            index % 3 === 0 ? 'bg-neo-yellow' : index % 3 === 1 ? 'bg-neo-blue' : 'bg-neo-pink'
          } -z-10`} />
          
          <div className="flex items-center justify-between mb-2">
            <div className="truncate pr-2">
               <p className="font-black text-lg truncate group-hover:text-black transition-colors">{device.hostname || device.name || device.ip}</p>
               {device.hostname && <p className="text-xs font-bold text-gray-500 group-hover:text-black">{device.ip}</p>}
            </div>
            <div className="border-2 border-black px-2 py-0.5 bg-neo-green text-xs font-black uppercase shadow-neo-sm group-hover:bg-white group-hover:shadow-none transition-all flex-shrink-0">
              Online
            </div>
          </div>
          <div className="text-sm font-mono space-y-1 text-black font-bold">
            <p>MAC: {device.mac.split(':').map((part, i) => i < 3 ? part : 'XX').join(':')}</p>
            <p>Vendor: {device.vendor || 'Unknown'}</p>
            {device.type && device.type !== 'Unknown Device' && <p className="text-neo-red uppercase">{device.type}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
