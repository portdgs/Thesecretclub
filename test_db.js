import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envvars = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let val = match[2] || '';
        val = val.trim();
        // Remove quotes if present
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        envvars[match[1]] = val;
    }
});

const supabaseUrl = envvars['VITE_SUPABASE_URL'];
const supabaseKey = envvars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key in .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Fetching profiles (Simple Query)...");
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

    if (error) {
        console.error("Error fetching native profiles:", error);
        return;
    }

    console.log(`Successfully fetched ${data?.length} profiles.\n`);

    if (data && data.length > 0) {
        console.log("Sample Data:");
        data.slice(0, 5).forEach(p => {
            console.log(`- ID: ${p.id} Name: ${p.name}, Role: ${p.role}, Plan: ${p.active_plan_id}`);
        });
    } else {
        console.log("No profiles found in the database. Are they deleted or hidden?");
    }
}

testFetch();
