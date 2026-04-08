class StudioError extends Error {
  constructor(code, message, cause) {
    super(message)
    this.name = "StudioError"
    this.code = code
    this.cause = cause
  }

  static engineUnavailable(cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return new StudioError("ENGINE_UNAVAILABLE", `Engine unavailable: ${message}`, cause)
  }
}

module.exports = {
  StudioError,
}
