import { createRouter, createWebHashHistory } from "vue-router";
import Layout from '@render/components/AppShell.vue'
import LocalNode from "@render/components/WorkbenchLocalNode.vue";
import AvailableNode from "@render/components/WorkbenchAvailableNode.vue";
import Dashboard from "@render/components/WorkbenchDashboard.vue";
import Setting from '../components/WorkbenchSetting.vue';

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
      redirect: "/dashboard",
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
  // Keep navigation state deterministic when switching between workbench pages.
  scrollBehavior() {
    return {
      top: 0,
    };
  },
});

export default router;
