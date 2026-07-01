export const RANDOM_ADDRESS_NAMES = [
  'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'charles',
  'joseph', 'thomas', 'christopher', 'daniel', 'paul', 'mark', 'donald', 'george',
  'kenneth', 'steven', 'edward', 'brian', 'ronald', 'anthony', 'kevin', 'jason',
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica',
  'sarah', 'karen', 'nancy', 'lisa', 'betty', 'margaret', 'sandra', 'ashley',
  'kimberly', 'emily', 'donna', 'michelle', 'carol', 'amanda', 'melissa', 'olivia',
  'emma', 'sophia', 'ava', 'isabella', 'mia', 'amelia', 'harper', 'evelyn'
]

export const generateRandomAddressName = (random = Math.random) => {
  const name = RANDOM_ADDRESS_NAMES[Math.floor(random() * RANDOM_ADDRESS_NAMES.length)]
  const month = Math.floor(random() * 12) + 1
  const daysInMonth = new Date(2000, month, 0).getDate()
  const day = Math.floor(random() * daysInMonth) + 1
  return `${name}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`
}
