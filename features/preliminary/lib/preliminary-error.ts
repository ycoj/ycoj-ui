// Shared failure signal for preliminary save/submit. Use instanceof to
// distinguish expected request failures from backend messages; the message
// stays unique so it never collides with i18n keys or backend copy.
export class PreliminaryRequestError extends Error {
  constructor() {
    super('PreliminaryRequestFailed');
    this.name = 'PreliminaryRequestError';
  }
}
