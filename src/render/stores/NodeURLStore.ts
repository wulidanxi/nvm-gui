import {defineStore} from 'pinia'
import {ref} from 'vue'

export const useNodeURLStore = defineStore('nodeUrl', () => {
    const nodeUrl = ref("https://nodejs.org/dist/index.json")
    const cacheHours = ref(24)

    function toggleNodeUrl(value: string) {
        nodeUrl.value = value;
    }

    function setCacheHours(value: number) {
        cacheHours.value = value;
    }

    return {
        nodeUrl, cacheHours, toggleNodeUrl, setCacheHours,
    }

}, {
    persist: true
})
