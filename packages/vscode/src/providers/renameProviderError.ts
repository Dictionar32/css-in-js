export class RenameProviderError extends Error {
  public readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "RenameProviderError"
    this.code = code
  }
}
