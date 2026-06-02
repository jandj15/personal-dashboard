declare module "ical-expander" {
  interface IcalTime {
    toJSDate(): Date;
    isDate: boolean;
  }
  interface IcalEvent {
    summary: string;
    location: string;
    uid: string;
    startDate: IcalTime;
    endDate: IcalTime;
  }
  interface IcalOccurrence {
    startDate: IcalTime;
    endDate: IcalTime;
    recurrenceId: IcalTime;
    item: IcalEvent;
  }
  interface BetweenResult {
    events: IcalEvent[];
    occurrences: IcalOccurrence[];
  }
  export default class IcalExpander {
    constructor(opts: { ics: string; maxIterations?: number; skipInvalidDates?: boolean });
    between(after?: Date, before?: Date): BetweenResult;
    all(): BetweenResult;
  }
}
