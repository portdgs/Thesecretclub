
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPlans() {
    const { data, error } = await supabase.from('plans').select('*');
    if (error) {
        console.error('Erro:', error);
    } else {
        console.table(data);
    }
}

checkPlans();
