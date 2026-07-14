let nodeEnvDirty = false;

/** 标记 NVM 变更后需要刷新依赖 Node 环境的页面。 */
export function markNodeEnvDirty() {
  nodeEnvDirty = true;
}

/** 读取并清除一次性脏标记。 */
export function consumeNodeEnvDirty() {
  if (nodeEnvDirty) {
    nodeEnvDirty = false;
    return true;
  }
  return false;
}
