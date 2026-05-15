// Run: node scripts/setup-supabase.mjs <SUPABASE_URL> <SERVICE_ROLE_KEY>
const url = process.argv[2];
const key = process.argv[3];

if (!url || !key) {
  console.error("Usage: node scripts/setup-supabase.mjs <URL> <SERVICE_ROLE_KEY>");
  process.exit(1);
}

const SQL = `
CREATE TABLE IF NOT EXISTS registrations (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  country TEXT,
  level TEXT,
  plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'premium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function runSQL(query) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql: query }),
  });
  return res;
}

async function checkTable(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  return { status: res.status, ok: res.ok, body: await res.text() };
}

async function main() {
  console.log("Checking tables...");
  
  const reg = await checkTable("registrations");
  const usr = await checkTable("users");
  
  console.log("registrations:", reg.status, reg.ok ? "EXISTS" : "MISSING - " + reg.body.slice(0,100));
  console.log("users:", usr.status, usr.ok ? "EXISTS" : "MISSING - " + usr.body.slice(0,100));

  if (!reg.ok || !usr.ok) {
    console.log("\n=== TABLES MANKE. Ekzekite SQL sa yo nan Supabase Dashboard > SQL Editor: ===");
    console.log(SQL);
  } else {
    console.log("\nTout tablo yo prè!");
  }
}

main().catch(console.error);
