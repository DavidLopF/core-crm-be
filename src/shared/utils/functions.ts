export const getSingular = (str: string): string => {
  if (str.endsWith('es')) {
    return str.slice(0, str.length - 2);
  } else if (str.endsWith('s')) {
    return str.slice(0, str.length - 1);
  } else {
    return str;
  }
};