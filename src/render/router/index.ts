import { createRouter, createWebHashHistory } from "vue-router";
import Layout from '@render/components/AppShell.vue'

const LocalNode = () => import('@render/components/WorkbenchLocalNode.vue')
const AvailableNode = () => import('@render/components/WorkbenchAvailableNode.vue')
const Dashboard = () => import('@render/components/WorkbenchDashboard.vue')
const Setting = () => import('@render/components/WorkbenchSetting.vue')
const CommandLog = () => import('@render/components/WorkbenchCommandLog.vue')

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
          name: "dashboard",
          component: Dashboard
        },
        {
          path: "local",
          name: "local-node-versions",
          component: LocalNode
        },
        {
          path: "available",
          name: "available-node-versions",
          component: AvailableNode
        },
        {
          path: "setting",
          name: "settings",
          meta: { section: "general" },
          component: Setting
        },
        {
          path: "logs",
          name: "command-logs",
          component: CommandLog
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
