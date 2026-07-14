import {defineStore} from 'pinia'
import {ref} from 'vue'

/** 持久化 Node.js 发布数据源及其缓存有效期。 */
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
