export class ScoreboardExportLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScoreboardExportLimitError';
  }
}

export class ScoreboardExportBusyError extends Error {
  constructor() {
    super('Scoreboard export capacity is exhausted');
    this.name = 'ScoreboardExportBusyError';
  }
}
