<script lang="ts">
import { defineComponent } from 'vue'
import { useDialog, useMessage } from 'naive-ui'

export default defineComponent({
  setup() {
    // Legacy components still read Naive UI handles from window globals.
    window.$message = useMessage()
    window.$dialog = useDialog()
  },
})
</script>

<template></template>
