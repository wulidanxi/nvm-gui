import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUpdateStore = defineStore('update', () => {
  const autoCheck = ref(true)

  function setAutoCheck(value: boolean) {
    autoCheck.value = value
  }

  return { autoCheck, setAutoCheck }
}, {
  persist: true,
})
