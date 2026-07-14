/**
 * 基于 Promise 队列的轻量互斥锁。
 * 主进程用它串行化同一持久化文件的读写，避免并发覆盖。
 */
export class AsyncMutex {
  private tail: Promise<void> = Promise.resolve()

  /** 等待前序任务结束后独占执行任务，并保证异常时也会释放队列。 */
  public async runExclusive<T>(task: () => Promise<T>): Promise<T> {
    let release: () => void = () => {}
    const previous = this.tail
    this.tail = new Promise<void>((resolve) => {
      release = resolve
    })

    await previous
    try {
      return await task()
    }
    finally {
      release()
    }
  }
}
