<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
</script>

<template>
  <NConfigProvider>
    <NMessageProvider>
      <NDialogProvider>
        <RouterView></RouterView>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style></style>
