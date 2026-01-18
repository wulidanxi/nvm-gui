import { createRouter, createWebHashHistory } from "vue-router";
import Layout from '@render/components/index.vue'
import LocalNode from "@render/components/LocalNode.vue";
import AvailableNode from "@render/components/AvailableNode.vue";
import Dashboard from "@render/components/Dashboard.vue";
import Setting from '../components/Setting.vue';

const routes = [
  { path: '/dashboard', component: Dashboard },
  { path: '/local', component: LocalNode},
  { path: '/available', component: AvailableNode},
  { path: '/setting', component: Setting },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: Layout,
      redirect: "/dashboard", // Explicit redirect at root level
      children: [
        {
          path: "dashboard",
          component: Dashboard
        },
        {
          path: "local",
          component: LocalNode
        },
        {
          path: "available",
          component: AvailableNode
        },
        {
          path: "setting",
          component: Setting
        }
      ]
    }
  ],
  // vue=route配置项
  scrollBehavior() {
    return {
      top: 0,
    };
  },
});

export default router;