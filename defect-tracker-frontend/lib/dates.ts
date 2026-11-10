/**
 * Calendar days and months as the user sees them.
 *
 * The API speaks "YYYY-MM-DD" (and "YYYY-MM" for production months). Date
 * pickers hand back a Date at midnight in the user's own time zone. Converting
 * with toISOString() would shift that to UTC first, which in Turkey (UTC+3)
 * turns the chosen day into the day before. These helpers never do that.
 */
import { format, parseISO } from 'date-fns';

/** Date -> "YYYY-MM-DD", by the user's calendar. */
export const toDay = (date: Date): string => format(date, 'yyyy-MM-dd');

/** "YYYY-MM-DD" -> Date at the start of that day in the user's time zone. */
export const fromDay = (day: string): Date => parseISO(day);

/** Today as "YYYY-MM-DD", by the user's calendar. */
export const todayAsDay = (): string => toDay(new Date());

/** Date -> "YYYY-MM". */
export const toMonth = (date: Date): string => format(date, 'yyyy-MM');

/** "YYYY-MM" -> Date on the first of that month. */
export const fromMonth = (month: string): Date => parseISO(`${month}-01`);
