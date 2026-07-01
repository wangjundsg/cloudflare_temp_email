import { describe, expect, test } from 'vitest'

import { generateRandomAddressName, RANDOM_ADDRESS_NAMES } from '../address-name'

describe('generateRandomAddressName', () => {
  test('uses a common English name followed by MMDD', () => {
    const result = generateRandomAddressName(() => 0)

    expect(result).toBe(`${RANDOM_ADDRESS_NAMES[0]}0101`)
  })

  test('pads month and day to two digits', () => {
    const result = generateRandomAddressName(() => 0.5)

    expect(result).toMatch(/^[a-z]+[0-9]{4}$/)
    expect(result.slice(-4)).toBe('0716')
  })
})
