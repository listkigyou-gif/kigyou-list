import { SmartSearchLRUCache } from '../searchCache';

async function runTests() {
  console.log('🧪 Starting SmartSearchLRUCache Comprehensive Unit Tests...\n');

  // Test 1: Key Normalization Determinism
  console.log('Test 1: Key Normalization Determinism');
  const keyA = SmartSearchLRUCache.normalizeKey('', {
    prefecture_code: '13',
    has_hiring: true,
    min_capital: 1000
  }, 15, 0);

  const keyB = SmartSearchLRUCache.normalizeKey('', {
    min_capital: 1000,
    has_hiring: true,
    prefecture_code: '13'
  }, 15, 0);

  if (keyA === keyB) {
    console.log(`  ✅ Passed: Keys are identical regardless of property order:\n     "${keyA}"`);
  } else {
    console.error(`  ❌ Failed: Keys differ!\n     A: ${keyA}\n     B: ${keyB}`);
    process.exit(1);
  }

  // Test 2: In-Memory Set and Get
  console.log('\nTest 2: Basic Set and Get with Telemetry');
  const cache = new SmartSearchLRUCache();
  const mockResult = {
    companies: [{ corporate_number: '1234567890123', company_name: 'Test Co' }] as any,
    totalCount: 1
  };

  cache.set(keyA, mockResult);
  const fetched = cache.get(keyA);

  if (fetched && fetched.companies[0].company_name === 'Test Co') {
    console.log('  ✅ Passed: Retrieved exact cached payload');
  } else {
    console.error('  ❌ Failed to retrieve cached payload');
    process.exit(1);
  }

  // Test 3: TTL Expiration
  console.log('\nTest 3: TTL Expiration');
  const tempKey = 'test:temp_key';
  cache.set(tempKey, mockResult, 50); // 50ms TTL
  const immediateGet = cache.get(tempKey);
  if (!immediateGet) {
    console.error('  ❌ Failed: Item should be present immediately');
    process.exit(1);
  }

  await new Promise(r => setTimeout(r, 70)); // wait 70ms
  const expiredGet = cache.get(tempKey);
  if (expiredGet === null) {
    console.log('  ✅ Passed: Item automatically expired after TTL');
  } else {
    console.error('  ❌ Failed: Expired item was still returned');
    process.exit(1);
  }

  // Test 4: Selective Caching Policy
  console.log('\nTest 4: Selective Caching Policy (Page 1-5 only)');
  if (SmartSearchLRUCache.shouldCache(0) && SmartSearchLRUCache.shouldCache(60) && !SmartSearchLRUCache.shouldCache(75)) {
    console.log('  ✅ Passed: Page 1-5 cached, Page > 5 excluded to protect RAM');
  } else {
    console.error('  ❌ Failed: shouldCache logic incorrect');
    process.exit(1);
  }

  // Test 5: Telemetry stats
  console.log('\nTest 5: Telemetry Stats');
  const stats = cache.getTelemetry();
  console.log('  Telemetry output:', JSON.stringify(stats, null, 2));
  if (stats.hits >= 2 && stats.misses >= 1) {
    console.log('  ✅ Passed: Telemetry counters working accurately');
  } else {
    console.error('  ❌ Failed: Telemetry counts incorrect');
    process.exit(1);
  }

  console.log('\n🎉 ALL 5 UNIT TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
