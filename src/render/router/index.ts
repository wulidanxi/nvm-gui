import { createRouter, createWebHashHistory } from "vue-router";
import Layout from '@render/shell/AppShell.vue'

const LocalNode = () => import('@render/features/node-versions/LocalVersionsPage.vue')
const AvailableNode = () => import('@render/features/node-versions/AvailableVersionsPage.vue')
const Dashboard = () => import('@render/features/dashboard/DashboardPage.vue')
const Setting = () => import('@render/features/settings/SettingsPage.vue')
const CommandLog = () => import('@render/features/command-logs/CommandLogsPage.vue')

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
