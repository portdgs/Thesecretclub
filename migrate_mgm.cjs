const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
    console.log('Iniciando migração...');

    // As we can't run ALTER TABLE directly with the JS client via standard RPC unless we have a specific function,
    // we can try creating a SQL function or use the REST API if we have full access.
    // However, the standard way in Supabase without direct SQL access is via an RPC call.
    // Let's create an RPC function first if it doesn't exist, or just use `supabase db push` if we have the CLI.
    // Since we don't know if supabase CLI is logged in, we will create a fetch request to the SQL endpoint if we have the service role key.

    const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/`;
    const headers = {
        'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };

    const sql = `
        ALTER TABLE affiliate_commissions ADD COLUMN IF NOT EXISTS available_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE affiliate_commissions ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
        
        -- Atualizar registros antigos para liberar o saque imediatamente (já que não havia carência)
        UPDATE affiliate_commissions SET available_at = created_at WHERE available_at IS NULL;
    `;

    try {
        // Unfortunately standard REST API doesn't support raw SQL execution directly like this without pgmeta.
        // I will write this to migrations.sql and then we can ask the user to run it if they have the dashboard, 
        // OR we can use supabase postgres connection if we have the connection string.
        console.log("Por favor, execute o seguinte comando SQL no seu painel do Supabase (SQL Editor):\n");
        console.log(sql);
    } catch (err) {
        console.error("Migration falhou:", err);
    }
}

runMigration();
