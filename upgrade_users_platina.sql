-- 1. Find the Platina plan ID
DO $$
DECLARE
    platina_plan_id UUID;
    target_emails TEXT[] := ARRAY[
        'hoxejir859@him6.com',
        'mitejof695@him6.com',
        'kehitem331@keecs.com',
        'nebibi4016@him6.com',
        'fihop51641@him6.com',
        'tayamo7513@keecs.com',
        'noniwig588@keecs.com',
        'sayinaf227@him6.com',
        'xarer33067@keecs.com',
        'felixit406@keecs.com',
        'yexid73189@keecs.com',
        'sahoge5693@keecs.com',
        'cacariy130@him6.com',
        'gavavi8596@him6.com'
    ];
    user_record RECORD;
BEGIN
    SELECT id INTO platina_plan_id FROM plans WHERE name ILIKE 'Platina' LIMIT 1;

    IF platina_plan_id IS NULL THEN
        RAISE EXCEPTION 'Plano Platina não encontrado na tabela plans.';
    END IF;

    -- Update profiles where the auth.users email matches the list (via a join)
    FOR user_record IN
        SELECT au.id, au.email
        FROM auth.users au
        WHERE au.email = ANY(target_emails)
    LOOP
        UPDATE profiles
        SET active_plan_id = platina_plan_id
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Perfil de % (ID: %) atualizado para Platina.', user_record.email, user_record.id;
    END LOOP;

END $$;
