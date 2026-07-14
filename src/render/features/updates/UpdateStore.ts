import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 持久化自动检查和预发布通道偏好。 */
export const useUpdateStore = defineStore('update', () => {
  const autoCheck = ref(true)
  const includePrerelease = ref(false)

  function setAutoCheck(value: boolean) {
    autoCheck.value = value
  }

  function setIncludePrerelease(value: boolean) {
    includePrerelease.value = value
  }

  return { autoCheck, includePrerelease, setAutoCheck, setIncludePrerelease }
}, {
  persist: true,
})
