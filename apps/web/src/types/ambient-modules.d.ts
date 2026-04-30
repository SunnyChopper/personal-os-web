/** Subpath entry used instead of cron-parser barrel (Windows / Vite; see repo success-patterns). */
declare module 'cron-parser/dist/CronExpressionParser.js' {
  export const CronExpressionParser: {
    parse(
      expression: string,
      options?: Record<string, unknown>
    ): {
      next(): { toDate(): Date; value?: Date };
    };
  };
}
