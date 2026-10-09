export class LessonRequestGuard {
  #revision = 0
  #lessonId = null

  select(lessonId) {
    this.#lessonId = lessonId
    this.#revision += 1
    return { lessonId, revision: this.#revision }
  }

  clear() {
    this.#lessonId = null
    this.#revision += 1
  }

  isCurrent(request) {
    return Boolean(request)
      && request.revision === this.#revision
      && request.lessonId === this.#lessonId
  }
}
