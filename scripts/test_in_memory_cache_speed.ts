import { searchCompanies, getSearchCacheTelemetry } from '../frontend/src/lib/db';
import { SmartSearchLRUCache } from '../frontend/src/lib/searchCache';

async function runBenchmark() {
  console.log('🚀 Benchmarking In-Memory Smart LRU Cache Speed & Hit Ratio...\n');

  // Scenario 1: First Query (Cold - Cache Miss)
  console.log('--- Step 1: Cold Query (Cache Miss) ---');
  const t0 = performance.now();
  const res1 = await searchCompanies('', { prefecture_code: '13', has_hiring: true }, 15, 0);
  const dur1 = performance.now() - t0;
  console.log(`  ⏱️ Result 1: ${res1.companies.length} companies (total: ${res1.totalCount}) in ${dur1.toFixed(2)}ms`);

  // Scenario 2: Identical Query (Warm - Cache Hit)
  console.log('\n--- Step 2: Warm Query (Cache Hit) ---');
  const t1 = performance.now();
  const res2 = await searchCompanies('', { prefecture_code: '13', has_hiring: true }, 15, 0);
  const dur2 = performance.now() - t1;
  console.log(`  ⚡ Result 2 (RAM Hit): ${res2.companies.length} companies in ${dur2.toFixed(3)}ms`);
  const speedup = (dur1 / dur2).toFixed(1);
  console.log(`  🔥 Speedup: ${speedup}x faster than database!`);

  // Scenario 3: Shuffled Params Order (Normalized Key Cache Hit)
  console.log('\n--- Step 3: Shuffled Order Query (Canonical Key Hit) ---');
  const t2 = performance.now();
  // Pass has_hiring first, then prefecture_code
  const res3 = await searchCompanies('', { has_hiring: true, prefecture_code: '13' }, 15, 0);
  const dur3 = performance.now() - t2;
  console.log(`  ⚡ Result 3 (Normalized Hit): ${res3.companies.length} companies in ${dur3.toFixed(3)}ms`);

  // Scenario 4: Complex Multi-criteria Combo
  console.log('\n--- Step 4: Complex Combo Search ---');
  const t3 = performance.now();
  const res4 = await searchCompanies('', {
    prefecture_code: '13',
    has_hiring: true,
    has_contact_form: true,
    min_employees: 30
  }, 15, 0);
  const dur4 = performance.now() - t3;
  console.log(`  ⏱️ Combo Cold Query: in ${dur4.toFixed(2)}ms`);

  const t4 = performance.now();
  const res5 = await searchCompanies('', {
    min_employees: 30,
    has_contact_form: true,
    has_hiring: true,
    prefecture_code: '13'
  }, 15, 0);
  const dur5 = performance.now() - t4;
  console.log(`  ⚡ Combo Warm Query (RAM Hit): in ${dur5.toFixed(3)}ms`);
  console.log(`  🔥 Combo Speedup: ${(dur4 / dur5).toFixed(1)}x faster!`);

  // Telemetry Report
  console.log('\n--- Cache Telemetry & Memory Safety ---');
  const telemetry = getSearchCacheTelemetry();
  console.log(JSON.stringify(telemetry, null, 2));

  console.log('\n🎉 IN-MEMORY LRU CACHE BENCHMARK COMPLETED SUCCESSFULLY!');
}

runBenchmark().catch(err => {
  console.error(err);
  process.exit(1);
});
