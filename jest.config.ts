export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/routes/preorder.ts',
    'src/routes/reservation.ts'
  ],
  coverageThreshold: {
    global: { statements: 100 },
  },
}