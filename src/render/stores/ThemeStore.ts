import {defineStore} from 'pinia'
import {ref} from 'vue'

export const useThemeStore = defineStore('theme', () => {
    const theme = ref(localStorage.getItem("theme") || "light")

    function toggleTheme(value: string) {
        theme.value = value === 'dark' ? 'dark' : 'light'
    }

    return {
        theme, toggleTheme,
    }

})