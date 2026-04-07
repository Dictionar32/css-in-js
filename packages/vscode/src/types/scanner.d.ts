declare module "@tailwind-styled/scanner" {
  export interface ScanWorkspaceFile {
    file: string
    classes: string[]
  }

  export interface ScanWorkspaceResult {
    files: ScanWorkspaceFile[]
  }

  export function scanWorkspaceAsync(rootPath: string): Promise<ScanWorkspaceResult>
}
