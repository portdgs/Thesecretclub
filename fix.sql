ALTER TABLE profiles ADD CONSTRAINT profiles_active_plan_id_fkey FOREIGN KEY (active_plan_id) REFERENCES plans(id);  
