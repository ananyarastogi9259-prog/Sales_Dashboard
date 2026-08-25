import fs from 'fs';

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZG1yamh1Y25jb3RmeHd2am5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0ODc0NzMsImV4cCI6MjA5OTA2MzQ3M30.z9oJrk1GwysxDDGWYB08PIPaidib8lSwWE9drJ80N2Y';
const url = 'https://uwdmrjhucncotfxwvjns.supabase.co/rest/v1/orders?select=order_date_time&order=order_date_time.desc&limit=1';

async function test() {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
