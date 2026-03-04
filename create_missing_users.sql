-- ATENÇÃO: COLE ESTE CÓDIGO NO SQL EDITOR DO SUPABASE E CLIQUE EM RUN

DO $$
DECLARE
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
    target_pwd TEXT := 'Agosto@29';
    platina_plan_id UUID;
    v_email TEXT;
    new_user_id UUID;
    encrypted_pwd TEXT;
BEGIN
    -- 1. Encontra o ID do plano Platina
    SELECT id INTO platina_plan_id FROM public.plans WHERE name ILIKE 'Platina' LIMIT 1;

    IF platina_plan_id IS NULL THEN
        RAISE EXCEPTION 'Plano Platina não encontrado. O script foi abortado.';
    END IF;

    -- 2. Gera a senha criptografada que o Supabase exige (Bcrypt)
    encrypted_pwd := extensions.crypt(target_pwd, extensions.gen_salt('bf'));

    -- 3. Loop por cada email da lista
    FOREACH v_email IN ARRAY target_emails
    LOOP
        -- Verifica se o usuário já existe em auth.users
        SELECT id INTO new_user_id FROM auth.users WHERE email = v_email LIMIT 1;

        -- SE NÃO EXISTE, CRIA O USUÁRIO
        IF new_user_id IS NULL THEN
            new_user_id := gen_random_uuid();
            
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                is_super_admin,
                is_sso_user
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                new_user_id,
                'authenticated',
                'authenticated',
                v_email,
                encrypted_pwd,
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}',
                '{}',
                false,
                false
            );

            RAISE NOTICE 'Conta CRIADA na Auth: %', v_email;
        ELSE
            -- Se já existia, apenas atualiza a senha de forma segura para garantir
            UPDATE auth.users SET encrypted_password = encrypted_pwd WHERE id = new_user_id;
            RAISE NOTICE 'Conta ATUALIZADA na Auth: %', v_email;
        END IF;

        -- CRIA A IDENTIDADE DO USUÁRIO (NECESSÁRIA PARA O LOGIN NÃO DAR ERRO DE SCHEMA)
        IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = new_user_id AND provider = 'email') THEN
            INSERT INTO auth.identities (
                id,
                user_id,
                provider_id,
                provider,
                identity_data,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(), -- ID da identidade
                new_user_id,       -- ID do usuário
                new_user_id::text, -- O provider_id é o próprio user ID no formato texto
                'email',
                format('{"sub":"%s","email":"%s"}', new_user_id::text, v_email)::jsonb,
                NOW(),
                NOW(),
                NOW()
            );
        END IF;

        -- 4. Agora lida com a tabela PROFILES (Pública)
        -- Tenta inserir o perfil, se não existir. Se existir, apenas atualiza.
        INSERT INTO public.profiles (
            id,
            name,
            role,
            active_plan_id,
            verified,
            city,
            created_at,
            updated_at
        )
        VALUES (
            new_user_id,
            'Modelo VIP (' || split_part(v_email, '@', 1) || ')', -- Nome temporário baseado no email
            'acompanhante',
            platina_plan_id,
            true, -- Já entra como verificada se quiser
            'Brasil', -- Cidade padrão necessária
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            active_plan_id = EXCLUDED.active_plan_id,
            verified = true,
            updated_at = NOW();

        RAISE NOTICE 'Perfil CONFIGURADO como Platina para: %', v_email;

    END LOOP;

    RAISE NOTICE 'Concluído! Todos os % emails agora podem logar com a senha %', array_length(target_emails, 1), target_pwd;

END $$;
