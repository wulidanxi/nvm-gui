<template>
  <div class="advanced-settings">
    <n-card :bordered="false" size="small">
      <n-form
          label-placement="left"
          label-width="auto"
      >
        <!-- 新增: 使用naive-ui的NInput组件 -->
        <n-form-item label="Node.js数据源：">
          <n-input
              v-model:value="nodejsUrl"
              placeholder="请输入Node.js数据源"
              @blur="validateUrl"
          />
        </n-form-item>
        <n-message-provider>
          <n-dialog-provider>
            <useMessageComponents/>
          </n-dialog-provider>
        </n-message-provider>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
// 高级设置的逻辑可以在这里实现
import {ref} from 'vue';
import useMessageComponents from "@render/components/useMessageComponents.vue";
import {NCard, NDialogProvider, NForm, NFormItem, NInput, NMessageProvider} from 'naive-ui';
import {useNodeURLStore} from "@render/stores/NodeURLStore";

const store = useNodeURLStore();
// 新增: 定义nodejsUrl变量
const nodejsUrl = ref<string>(store.nodeUrl);

// 新增: 使用naive-ui的消息提示
const message = window.$message;

// 新增: 校验网址格式的方法
const validateUrl = () => {
  // 定义网址格式的正则表达式
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

  if (urlPattern.test(nodejsUrl.value)) {
    console.log('Node.js网址已更新:', nodejsUrl.value);
    //localStorage.setItem("nodeUrl", nodejsUrl.value); // 保存到本地存储
  } else {
    message.error('请输入有效的网址格式');
    nodejsUrl.value = localStorage.getItem("nodeUrl") || ""; // 恢复为上一次正确的值
  }
};

// 新增: 定义保存方法
const saveSettings = () => {
  // 这里可以添加保存逻辑，例如将当前设置保存到服务器或本地存储
  store.toggleNodeUrl(nodejsUrl.value);
};

// 暴露保存方法给父组件
defineExpose({
  saveSettings
});
</script>

<style scoped>
.advanced-settings {
  padding: 10px;
}
</style>
