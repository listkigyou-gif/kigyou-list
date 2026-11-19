import assert from 'node:assert/strict';
import {
  getTodayJstIsoDate,
  calculateStatutoryJobExpiry,
  resolveActiveJobPostingValidThrough,
} from '../dateUtils';

const fixedNow = Date.parse('2026-11-18T16:00:00Z'); // 2026-11-19 01:00:00 JST

assert.equal(getTodayJstIsoDate(fixedNow), '2026-11-19');
assert.equal(calculateStatutoryJobExpiry('2026-04-01'), '2026-06-30');
assert.equal(calculateStatutoryJobExpiry('2026-11-18'), '2027-01-31');

// Expired statutory date must return null
assert.equal(
  resolveActiveJobPostingValidThrough(undefined, '2026-04-01', 60, fixedNow),
  null
);

// Explicit past expiry must return null even if datePosted is fresh
assert.equal(
  resolveActiveJobPostingValidThrough('2026-11-18', '2026-11-18', 60, fixedNow),
  null
);

// Explicit expiry matching today (JST) stays valid until 23:59:59+09:00
assert.equal(
  resolveActiveJobPostingValidThrough('2026-11-19', '2026-11-18', 60, fixedNow),
  '2026-11-19T23:59:59+09:00'
);

// Active HelloWork signal resolves to statutory end of 2nd month
assert.equal(
  resolveActiveJobPostingValidThrough(undefined, '2026-11-18', 60, fixedNow),
  '2027-01-31T23:59:59+09:00'
);

console.log('dateUtils JobPosting expiry tests PASSED');
