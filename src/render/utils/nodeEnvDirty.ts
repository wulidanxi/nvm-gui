let nodeEnvDirty = false;

export function markNodeEnvDirty() {
  nodeEnvDirty = true;
}

export function consumeNodeEnvDirty() {
  if (nodeEnvDirty) {
    nodeEnvDirty = false;
    return true;
  }
  return false;
}
