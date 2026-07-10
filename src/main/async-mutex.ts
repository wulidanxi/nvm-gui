export class AsyncMutex {
  private tail: Promise<void> = Promise.resolve()

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
