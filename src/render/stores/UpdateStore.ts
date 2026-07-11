import { defineStore } from 'pinia'
import { ref } from 'vue'

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
