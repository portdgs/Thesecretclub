-- 1. ADICIONAR COLUNA DE PESO DO PLANO NA TABELA PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_tier_weight INTEGER DEFAULT 0;

-- 2. SINCRONIZAR DADOS ATUAIS
-- Atualiza o plan_tier_weight em profiles buscando o tier_weight da tabela plans
UPDATE profiles p
SET plan_tier_weight = pl.tier_weight
FROM plans pl
WHERE p.active_plan_id = pl.id;

-- Garantir que quem não tem plano fique com peso 0
UPDATE profiles SET plan_tier_weight = 0 WHERE active_plan_id IS NULL;

-- 3. CRIAR FUNÇÃO DE TRIGGER PARA MANTER EM SINCRONIA
CREATE OR REPLACE FUNCTION sync_profile_tier_weight()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o active_plan_id mudou ou é um novo registro
  IF (TG_OP = 'INSERT') OR (NEW.active_plan_id IS DISTINCT FROM OLD.active_plan_id) THEN
    IF NEW.active_plan_id IS NULL THEN
      NEW.plan_tier_weight := 0;
    ELSE
      SELECT tier_weight INTO NEW.plan_tier_weight FROM plans WHERE id = NEW.active_plan_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR TRIGGER
DROP TRIGGER IF EXISTS on_plan_change_update_weight ON profiles;
CREATE TRIGGER on_plan_change_update_weight
BEFORE INSERT OR UPDATE OF active_plan_id ON profiles
FOR EACH ROW EXECUTE FUNCTION sync_profile_tier_weight();
