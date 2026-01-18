export interface NvmVersion {
  version: string;
  isCurrent: boolean;
  alias?: string;
}

/**
 * Parse the output of 'nvm ls' command
 * @param stdout - The raw output string from nvm ls
 * @returns Array of NvmVersion objects
 */
export function parseNvmList(stdout: string): NvmVersion[] {
  if (!stdout) return [];
  
  return stdout.split('\n')
    .filter(line => line.trim().length > 0) // Remove empty lines
    .map(line => {
      // Check if this line represents the current version
      const isCurrent = line.includes('*');
      
      // Extract version number
      // Example lines:
      // "  * 14.17.0 (Currently using 64-bit executable)"
      // "    12.22.1"
      let versionPart = line.replace('*', '').trim();
      
      // Remove extra info like "(Currently using ...)"
      if (versionPart.includes('(')) {
        versionPart = versionPart.split('(')[0].trim();
      }
      
      return {
        version: versionPart,
        isCurrent
      };
    })
    // Filter out lines that don't look like versions (just in case)
    .filter(item => /^(v)?\d+\.\d+\.\d+/.test(item.version));
}
