import '../render/styles/reset.css'
import '../render/styles/motion.css'

import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import { MotionPlugin } from '@vueuse/motion'
import { createApp } from 'vue'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia();
// 主题、语言和用户设置通过统一插件持久化。
pinia.use(piniaPluginPersistedstate);

app.use(naive)
app.use(pinia)
app.use(router)
app.use(MotionPlugin)
app.use(autoAnimatePlugin)

// 最后一层错误兜底，保留组件上下文供开发诊断。
app.config.errorHandler = (err, instance, info) => {
  console.error("Global Error:", err);
  console.log("Vue Instance:", instance);
  console.log("Error Info:", info);
};

app.mount('#app')
