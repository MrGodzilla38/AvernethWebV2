const isEnabled = process.env.DEBUG === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true';

export const debug = {
  log: (...args: any[]) => {
    if (isEnabled) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isEnabled) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (isEnabled) console.error(...args);
  },
};

export default debug;
