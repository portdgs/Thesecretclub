import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking profiles table schema...");
    // Query 1 row just to get the keys
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error("Error fetching profiles:", error);
    } else if (data && data.length > 0) {
        console.log("Columns found in profiles table:");
        console.log(Object.keys(data[0]).join('\n'));
    } else {
        console.log("Profiles table exists but is empty. Cannot infer columns from a simple select *.");
    }
}

checkSchema();
