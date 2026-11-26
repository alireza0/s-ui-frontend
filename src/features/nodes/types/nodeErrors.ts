// API envelopes may prefix a stable error code with an operation name.
export function nodeErrorCode(message: string): string {
  return /(?:^|:\s*)([a-z][a-z0-9_]+)\s*$/.exec(message)?.[1] ?? message
}
