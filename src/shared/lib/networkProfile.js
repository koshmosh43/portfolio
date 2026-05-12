export function readNetworkProfile() {
  const conn = typeof navigator !== 'undefined' ? navigator.connection : undefined
  const effectiveType = typeof conn?.effectiveType === 'string' ? conn.effectiveType : ''
  const saveData = Boolean(conn?.saveData)
  const isDataLite =
    saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g'

  return { effectiveType, saveData, isDataLite }
}
