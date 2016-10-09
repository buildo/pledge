const pad = n => n < 10 ? `0${n}` : n;

export const formatDate = date => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return `${date.getDate()} ${months[date.getMonth()]} at ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
