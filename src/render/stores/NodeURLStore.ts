import {defineStore} from 'pinia'
import {ref} from 'vue'

export const useNodeURLStore = defineStore('nodeUrl', () => {
    const nodeUrl = ref(localStorage.getItem("nodeUrl") || "https://nodejs.org/dist/index.json")

    function toggleNodeUrl(value: string) {
        nodeUrl.value = value;
    }

    return {
        nodeUrl, toggleNodeUrl,
    }

})