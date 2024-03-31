import { createRouter, createWebHashHistory } from "vue-router";
import Layout from '@render/components/index.vue'
import LocalNode from "@render/components/LocalNode.vue";
import AvailableNode from "@render/components/AvailableNode.vue";
import Dashboard from "@render/components/Dashboard.vue";


const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: Layout,
      children: [
        {
          path: "",
          component: Dashboard
        
      },
        {
          path: "local",
          component: LocalNode
        },
        {
          path: "available",
          component: AvailableNode
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