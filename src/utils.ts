

/**
 * Computes the parts of time from the given milliseconds
 * @param ms the milliseconds to compute
 * @returns the time parts
 */
export function timeParts(ms:number)
{
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
    milliseconds: ms % 1000,
  };
}

export interface NumFormat 
{
  precision?:number, 
  fixed?:number
}

/**
 * Formats the given milliseconds into human readable format
 */
export function timeFormat(ms:number, format?:NumFormat)
{
  const parts = timeParts(ms);
  let text = '';
  if (parts.days) text += `${parts.days} days`;
  if (parts.hours) text += (text !== '' ? ' ' : '') + `${formatNumber(parts.hours, format)} hours`;
  if (parts.minutes) text += (text !== '' ? ' ' : '') + `${formatNumber(parts.minutes, format)} mins`;
  if (parts.seconds) text += (text !== '' ? ' ' : '') + `${formatNumber(parts.seconds, format)} secs`;
  if (parts.milliseconds) text += (text !== '' ? ' ' : '') + `${formatNumber(parts.milliseconds, format)} ms`;
  return text;
}

/**
 * Formats the given number with precision or fixed decimals
 * @param num the number to format
 * @param format the formatting to use
 * @returns the formatted number as a string
 */
export function formatNumber(num:number, format?:NumFormat)
{
  let out = '';
  if (!Number.isInteger(num) && format)
  {
    if (format.precision) out = num.toPrecision(format.precision);
    else if (format.fixed) out = num.toFixed(format.fixed);
  }
  return out === '' ? num.toString() : out;
}