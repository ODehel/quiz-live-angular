export function messageType(data: string): unknown {
  try {
    return JSON.parse(data).type;
  } catch {
    return undefined;
  }
}
