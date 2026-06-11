import fs from 'fs';

// Load env variables manually from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function checkData() {
  try {
    // Let's query count of class table
    const countRes = await fetch(`${supabaseUrl}/rest/v1/class?select=count`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'count=exact'
      }
    });
    const countRange = countRes.headers.get('content-range');
    console.log('Total Count Header:', countRange);

    // Let's query first 5 rows
    const rowsRes = await fetch(`${supabaseUrl}/rest/v1/class?limit=5`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    const rows = await rowsRes.json();
    console.log('First 5 rows:');
    console.log(JSON.stringify(rows, null, 2));

    // Get unique 대학(원) and 학과(부)
    const uniqueRes = await fetch(`${supabaseUrl}/rest/v1/class?select=대학(원),학과(부)`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    const uniqueData = await uniqueRes.json();
    const colleges = {};
    uniqueData.forEach(row => {
      const col = row['대학(원)'];
      const dept = row['학과(부)'];
      if (!colleges[col]) colleges[col] = new Set();
      colleges[col].add(dept);
    });

    console.log('\nColleges and departments:');
    for (const [col, depts] of Object.entries(colleges)) {
      console.log(`- ${col}:`, Array.from(depts));
    }
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData();
