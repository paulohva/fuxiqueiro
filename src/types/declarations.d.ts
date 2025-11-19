declare module 'local-devices'
declare module 'portscanner'
declare module 'mac-lookup';

declare module 'oui-data';

interface IpcRenderer {
  on(channel: string, listener: (event: any, ...args: any[]) => void): void
  off(channel: string, listener: (event: any, ...args: any[]) => void): void
  send(channel: string, ...args: any[]): void
  invoke(channel: string, ...args: any[]): Promise<any>
}

interface Window {
  ipcRenderer: IpcRenderer
}

