import { ref } from 'vue'
import {
  installNodeVersion,
  uninstallNodeVersion,
  useNodeVersion,
} from '@render/api'
import { markNodeEnvDirty } from './nodeEnvDirty'

export function useNvmOperations() {
  const operatingVersion = ref<string | null>(null)

  async function install(version: string) {
    return run(version, () => installNodeVersion(normalizeVersion(version)))
  }

  async function use(version: string) {
    return run(version, () => useNodeVersion(version))
  }

  async function uninstall(version: string) {
    return run(version, () => uninstallNodeVersion(version))
  }

  async function run(version: string, action: () => Promise<unknown>) {
    operatingVersion.value = version
    try {
      const result = await action()
      markNodeEnvDirty()
      return result
    }
    finally {
      operatingVersion.value = null
    }
  }

  return {
    operatingVersion,
    install,
    use,
    uninstall,
  }
}

function normalizeVersion(version: string): string {
  return version.replace(/^v/i, '')
}

