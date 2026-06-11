import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 });
  }

  try {
    let allData: any[] = [];
    let page = 0;
    const limit = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const offset = page * limit;
      const res = await fetch(`${supabaseUrl}/rest/v1/class?limit=${limit}&offset=${offset}&select=*`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Supabase query failed: ${res.statusText}`);
      }

      const data = await res.json();
      allData = allData.concat(data);

      if (data.length < limit) {
        keepFetching = false;
      } else {
        page++;
      }
    }

    return NextResponse.json(allData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
