import '../render/styles/reset.css'

import { createApp } from 'vue'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(naive)
app.use(pinia)
app.use(router)

app.config.errorHandler = (err, instance, info) => {
  console.error("Global Error:", err);
  console.log("Vue Instance:", instance);
  console.log("Error Info:", info);
};

app.mount('#app')
