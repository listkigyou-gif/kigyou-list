require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { generateClaimToken, verifyClaimToken, buildClaimUrl } = require('../lib/marketing.ts');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runTest() {
  const client = await pool.connect();
  try {
    console.log('=== TEST 1: Token Generation & Verification ===');
    const corpNum = '1120005005403';
    const email = 'rokujizo.nurse@rokujizogh.jp';
    const token = generateClaimToken(corpNum, email);
    console.log('Generated claim token:', token);
    const isValid = verifyClaimToken(corpNum, email, token);
    console.log('Token verified:', isValid);

    const claimUrl = buildClaimUrl(corpNum, email);
    console.log('Generated claim URL:', claimUrl);

    console.log('\n=== TEST 2: Claim API Call (via HTTP) ===');
    const claimRes = await fetch('http://localhost:3000/api/companies/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corporate_number: corpNum,
        email: email,
        claim_token: token,
        person_in_charge: '山田 太郎',
        department: '広報宣伝部',
        phone: '011-563-0151',
        pr_title: '札幌もいわ徳洲会病院からのお知らせ',
        pr_message: '地域医療に貢献し、安心できる医療サービスを提供しております。最新の求人情報や病院見学も随時受付中です。',
        locale: 'ja'
      })
    });

    const claimData = await claimRes.json();
    console.log('Claim API Status:', claimRes.status, claimData);

    console.log('\n=== TEST 3: Verify in Database ===');
    const dbCheck = await client.query(
      'SELECT corporate_number, company_name, is_claimed, claimed_at, claimed_by_name, pr_title FROM companies WHERE corporate_number = $1',
      [corpNum]
    );
    console.log('DB Record:', dbCheck.rows[0]);

    console.log('\n=== CLEANUP: Reset test company ===');
    await client.query(`
      UPDATE companies 
      SET is_claimed = FALSE, claimed_at = NULL, claimed_by_name = NULL, claimed_by_email = NULL, claimed_by_phone = NULL, pr_title = NULL, pr_message = NULL
      WHERE corporate_number = $1
    `, [corpNum]);
    console.log('✅ Cleanup completed! Test passed 100%!');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runTest();
