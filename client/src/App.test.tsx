// Simple test to verify the test environment is working
test('basic test should pass', () => {
  expect(true).toBe(true)
})

test('environment check', () => {
  expect(process.env.NODE_ENV).toBe('test')
})

test('basic math operations', () => {
  expect(1 + 1).toBe(2)
  expect(2 * 3).toBe(6)
})

test('string operations', () => {
  const str = 'test'
  expect(str.length).toBe(4)
  expect(str.toUpperCase()).toBe('TEST')
})

test('array operations', () => {
  const arr = [1, 2, 3]
  expect(arr).toHaveLength(3)
  expect(arr[0]).toBe(1)
})
