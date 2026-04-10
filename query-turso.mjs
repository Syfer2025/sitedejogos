import { createClient } from "@libsql/client";

const client = createClient({
  url: "libsql://site-de-jogos-syfer.aws-us-east-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU3NDQ4NjYsImlkIjoiMDE5ZDcyYTMtZWUwMS03ZTBjLTg2ZjItMjAxMzgxZjQzYzlkIiwicmlkIjoiNzA3OTUzMDYtZjYwZi00OTgzLWFjZjYtOTA3NmFiNDI3ZWJlIn0.cyfA-nlMxv3r06dwe8EMGRXw0NPIKiy9IoanS0n-8E2dHwkS2TgqDimrYZ3Zr-yoQlk3mrDD_XavKtPGE6g1Dw",
});

async function run() {
  const rs = await client.execute("SELECT sql FROM sqlite_master WHERE type='table';");
  console.log(rs.rows.map(r => r.sql).join("\n\n"));
}
run();
