import '../render/styles/reset.css'

import { createApp } from 'vue'
//import naive from 'naive-ui'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
