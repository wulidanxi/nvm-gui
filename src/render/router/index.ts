import { createRouter, createWebHashHistory } from "vue-router";
import Layout from '@render/components/AppShell.vue'

const LocalNode = () => import('@render/components/WorkbenchLocalNode.vue')
const AvailableNode = () => import('@render/components/WorkbenchAvailableNode.vue')
const Dashboard = () => import('@render/components/WorkbenchDashboard.vue')
const Setting = () => import('@render/components/WorkbenchSetting.vue')

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
