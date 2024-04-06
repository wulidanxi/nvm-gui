<script lang="ts">
import { useMessage, useDialog } from "naive-ui";
import { defineComponent } from "vue";

// content
export default defineComponent({
  setup() {
    window.$message = useMessage(); // 关键代码
    window.$dialog = useDialog();
  },
});
</script>
<template></template>
