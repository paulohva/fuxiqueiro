import { useState, useEffect } from 'react'
import { DeviceList } from './components/DeviceList'
import { Device } from './types/device'

function App() {
  const [devices, setDevices] = useState<Device[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanningPorts, setScanningPorts] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  // Reset raw data view when selecting a new device
  useEffect(() => {
    setShowRawData(false)
  }, [selectedDevice?.mac])

  const startScan = async () => {
    setScanning(true)
    try {
      const result = await window.ipcRenderer.invoke('start-scan')
      
      // Merge new results with existing devices to preserve port info
      setDevices(prevDevices => {
        return result.map((newDevice: Device) => {
          const existing = prevDevices.find(d => d.mac === newDevice.mac)
          if (existing && existing.ports) {
            return { ...newDevice, ports: existing.ports, type: existing.type }
          }
          return newDevice
        })
      })
      
      // Update selected device if it exists in the new list
      if (selectedDevice) {
        const updated = result.find((d: Device) => d.mac === selectedDevice.mac)
        if (updated) {
          // Preserve ports if we already have them
          setSelectedDevice(prev => prev ? { ...updated, ports: prev.ports, type: prev.type } : null)
        }
      }
    } catch (error) {
      console.error('Scan failed:', error)
    } finally {
      setScanning(false)
    }
  }

  const scanPortsForDevice = async (device: Device) => {
    setScanningPorts(true)
    try {
      const { ports, type } = await window.ipcRenderer.invoke('check-ports', device.ip, device.vendor)
      
      // Update selected device
      setSelectedDevice(prev => {
        if (prev?.mac === device.mac) {
          return { ...prev, ports, type }
        }
        return prev
      })
      
      // Update main list
      setDevices(prev => prev.map(d => {
        if (d.mac === device.mac) {
          return { ...d, ports, type }
        }
        return d
      }))
    } catch (error) {
      console.error('Port scan failed:', error)
    } finally {
      setScanningPorts(false)
    }
  }

  const handleSelectDevice = async (device: Device) => {
    if (selectedDevice?.mac === device.mac) return

    setSelectedDevice(device)
    
    // We no longer auto-scan ports on selection. 
    // User must explicitly click "Scan Ports" or "Rescan Ports".
  }

  return (
    <div className="min-h-screen bg-neo-yellow font-sans flex p-6 gap-6">
      {/* Sidebar / Device List */}
      <div className="w-96 flex flex-col gap-6 flex-shrink-0">
        <div className="bg-white border-4 border-black p-4 shadow-neo flex justify-between items-center transform -rotate-1 hover:rotate-0 transition-transform duration-300">
          <div className="flex items-center gap-4">
            <img src="/src/assets/logo.png" alt="Fuxiqueiro Logo" className="w-24 h-24 object-contain" />
            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-black">Fuxiqueiro</h1>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-neo flex-1 flex flex-col overflow-hidden relative">
           <div className="p-4 border-b-4 border-black bg-neo-blue">
            <div className="flex justify-between items-center">
              <span className="font-black uppercase text-lg">Devices ({devices.length})</span>
              <button
                onClick={startScan}
                disabled={scanning}
                className={`px-6 py-2 border-4 border-black font-black text-sm uppercase transition-all ${
                  scanning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-neo-pink hover:shadow-neo-sm hover:-translate-y-1 active:translate-y-0 active:shadow-neo-sm'
                }`}
              >
                {scanning ? 'Scanning...' : 'Scan'}
              </button>
            </div>
           </div>
          <div className="flex-1 overflow-y-auto p-4 bg-neo-off-white">
            {devices.length === 0 && !scanning && (
               <div className="text-center p-8 opacity-50 font-black italic">
                 CLICK SCAN TO START
               </div>
            )}
            <DeviceList devices={devices} onSelectDevice={handleSelectDevice} scanning={scanning} />
          </div>
        </div>
      </div>

      {/* Main Content / Device Detail */}
      <div className="flex-1 flex flex-col">
        {selectedDevice ? (
          <div className="bg-white border-4 border-black shadow-neo-lg p-8 h-full relative overflow-y-auto">
            <button 
              onClick={() => setShowRawData(!showRawData)}
              className={`absolute top-0 right-0 px-8 py-4 font-black text-xl uppercase tracking-widest border-l-4 border-b-4 border-white transition-colors z-20 ${
                showRawData 
                  ? 'bg-neo-red text-white hover:bg-black' 
                  : 'bg-black text-white hover:bg-neo-red hover:text-black'
              }`}
            >
              {showRawData ? 'Close Details' : 'Details'}
            </button>
            
            {showRawData ? (
              <div className="absolute inset-0 top-20 bg-black p-8 text-green-400 font-mono overflow-auto z-10 border-t-4 border-white">
                <h3 className="text-white font-black text-2xl mb-4 border-b-2 border-white pb-2">RAW DEVICE DATA</h3>
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedDevice, null, 2)}
                </pre>
              </div>
            ) : (
              <>
            <div className="mb-12">
              <h2 className="text-6xl font-black mb-2 tracking-tight">{selectedDevice.hostname || selectedDevice.name || selectedDevice.ip}</h2>
              {selectedDevice.hostname && <p className="text-2xl font-bold text-gray-500 mb-4">{selectedDevice.ip}</p>}
              
              <div className="flex gap-4 flex-wrap">
                 <span className="px-4 py-2 bg-neo-green border-4 border-black font-black text-sm uppercase shadow-neo-sm">Online</span>
                 <span className="px-4 py-2 bg-neo-yellow border-4 border-black font-black text-sm uppercase shadow-neo-sm">{selectedDevice.vendor || 'Unknown Vendor'}</span>
                 {selectedDevice.type && selectedDevice.type !== 'Unknown Device' && (
                   <span className="px-4 py-2 bg-neo-red text-white border-4 border-black font-black text-sm uppercase shadow-neo-sm">{selectedDevice.type}</span>
                 )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="bg-neo-blue border-4 border-black p-8 shadow-neo hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all">
                <p className="text-sm font-black uppercase mb-2 tracking-wider bg-white inline-block px-2 border-2 border-black">IP Address</p>
                <p className="font-mono text-3xl font-black mt-2">{selectedDevice.ip}</p>
              </div>
              <div className="bg-neo-pink border-4 border-black p-8 shadow-neo hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all">
                <p className="text-sm font-black uppercase mb-2 tracking-wider bg-white inline-block px-2 border-2 border-black">MAC Address</p>
                <p className="font-mono text-3xl font-black mt-2">
                  {/* Mask MAC address: AA:BB:CC:XX:XX:XX */}
                  {selectedDevice.mac.split(':').map((part, i) => i < 3 ? part : 'XX').join(':')}
                </p>
              </div>
            </div>

            <div className="border-4 border-black p-8 bg-white relative shadow-neo">
              <div className="absolute -top-6 left-8 flex gap-4">
                <div className="bg-neo-red text-white border-4 border-black px-6 py-2 font-black uppercase text-lg shadow-neo-sm">
                  Exposed / Open Ports
                </div>
                <button 
                  onClick={() => scanPortsForDevice(selectedDevice)}
                  disabled={scanningPorts}
                  className={`px-4 py-2 border-4 border-black font-black text-sm uppercase shadow-neo-sm transition-all ${
                    scanningPorts 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-neo-blue hover:-translate-y-1 hover:shadow-neo active:translate-y-0 active:shadow-neo-sm'
                  }`}
                >
                  {scanningPorts ? 'Scanning...' : (selectedDevice.ports === undefined ? 'Scan Ports' : 'Rescan Ports')}
                </button>
              </div>
              
              {scanningPorts ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-full max-w-md h-8 border-4 border-black bg-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-neo-green animate-progress-indeterminate"></div>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-xs uppercase tracking-widest">Scanning Ports...</div>
                  </div>
                </div>
              ) : selectedDevice.ports && selectedDevice.ports.length > 0 ? (
                <ul className="flex flex-wrap gap-4 mt-4">
                  {selectedDevice.ports.map(portInfo => (
                    <li key={portInfo.port} className="bg-black text-neo-green border-4 border-black px-6 py-4 font-black text-xl shadow-neo hover:scale-105 transition-transform cursor-default flex flex-col items-center">
                      <span className="text-3xl">{portInfo.port}</span>
                      <span className="text-xs text-white uppercase mt-1 bg-neo-red px-2 py-0.5">{portInfo.description}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-black gap-4 border-2 border-black border-dashed bg-gray-50 mt-4">
                  <p className="font-black italic text-xl">
                    {selectedDevice.ports === undefined ? 'CLICK "SCAN PORTS" TO CHECK FOR OPEN PORTS.' : 'NO OPEN PORTS FOUND.'}
                  </p>
                </div>
              )}
            </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center border-4 border-black bg-white gap-8 shadow-neo-lg">
            <div className="w-32 h-32 bg-neo-yellow border-4 border-black rounded-full flex items-center justify-center shadow-neo animate-bounce">
              <span className="text-6xl font-black">?</span>
            </div>
            <p className="text-4xl font-black text-black uppercase tracking-widest bg-neo-blue px-4 py-1 border-4 border-black shadow-neo-sm">Select a device</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
