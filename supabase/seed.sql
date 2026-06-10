-- FlexiPulse: Development seed data
-- 5 departments, 1 admin (CEO), 3 users per department (1 manager, 2 employees),
-- 3 KPIs per department per period, 6 months of submissions (Jan-Jun 2026).
--
-- Result: Sales & Finance -> green, Marketing -> amber, Operations & Logistics -> red
-- All seed users have the password: password123

do $$
declare
  -- department ids
  dept_ids uuid[5];
  dept_names text[5] := array['Sales','Finance','Marketing','Operations','Logistics'];

  -- per-department user ids: [manager, employee1, employee2]
  manager_ids uuid[5];
  emp1_ids uuid[5];
  emp2_ids uuid[5];

  admin_id uuid := gen_random_uuid();

  -- periods, oldest first
  periods text[6] := array['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'];
  -- variance factors applied across the 6 periods (trending upward, realistic noise)
  factors numeric[6] := array[0.78, 0.85, 0.90, 0.95, 0.98, 1.00];

  -- per-department KPI templates: name, data_type, target, june ratio
  kpi_names text[3];
  kpi_types text[3];
  kpi_targets numeric[3];
  kpi_ratios numeric[3];

  d int;
  p int;
  k int;
  kpi_id uuid;
  ratio numeric;
  target numeric;
  actual numeric;
  assigned_user uuid;
  submitting_user uuid;
begin
  ------------------------------------------------------------------
  -- Admin (CEO)
  ------------------------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
    'ceo@flexipulse.dev', crypt('password123', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}', '{}',
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(), admin_id, admin_id::text,
    jsonb_build_object('sub', admin_id::text, 'email', 'ceo@flexipulse.dev'),
    'email', now(), now(), now()
  );

  insert into public.users (id, full_name, role, department_id)
  values (admin_id, 'Adaeze Okafor', 'admin', null);

  ------------------------------------------------------------------
  -- Departments + users
  ------------------------------------------------------------------
  for d in 1..5 loop
    dept_ids[d] := gen_random_uuid();
    insert into departments (id, name) values (dept_ids[d], dept_names[d]);

    manager_ids[d] := gen_random_uuid();
    emp1_ids[d] := gen_random_uuid();
    emp2_ids[d] := gen_random_uuid();
  end loop;

  -- create auth + public users for managers and employees
  declare
    full_names text[15] := array[
      -- Sales
      'Tunde Bakare', 'Ngozi Eze', 'Femi Adewale',
      -- Finance
      'Chiamaka Nwosu', 'Bola Salisu', 'Ifeoma Obi',
      -- Marketing
      'Kelechi Umeh', 'Yusuf Aliyu', 'Grace Effiong',
      -- Operations
      'Ahmed Lawal', 'Funke Oladipo', 'Emeka Chukwu',
      -- Logistics
      'Hauwa Bello', 'Segun Afolabi', 'Blessing Eyo'
    ];
    emails text[15] := array[
      'tunde.bakare@flexipulse.dev', 'ngozi.eze@flexipulse.dev', 'femi.adewale@flexipulse.dev',
      'chiamaka.nwosu@flexipulse.dev', 'bola.salisu@flexipulse.dev', 'ifeoma.obi@flexipulse.dev',
      'kelechi.umeh@flexipulse.dev', 'yusuf.aliyu@flexipulse.dev', 'grace.effiong@flexipulse.dev',
      'ahmed.lawal@flexipulse.dev', 'funke.oladipo@flexipulse.dev', 'emeka.chukwu@flexipulse.dev',
      'hauwa.bello@flexipulse.dev', 'segun.afolabi@flexipulse.dev', 'blessing.eyo@flexipulse.dev'
    ];
    user_id uuid;
    role_name text;
    idx int;
  begin
    for d in 1..5 loop
      for k in 1..3 loop
        idx := (d - 1) * 3 + k;
        if k = 1 then
          user_id := manager_ids[d];
          role_name := 'manager';
        elsif k = 2 then
          user_id := emp1_ids[d];
          role_name := 'employee';
        else
          user_id := emp2_ids[d];
          role_name := 'employee';
        end if;

        insert into auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at, confirmation_token, recovery_token,
          email_change_token_new, email_change
        ) values (
          '00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated',
          emails[idx], crypt('password123', gen_salt('bf')),
          now(), '{"provider":"email","providers":["email"]}', '{}',
          now(), now(), '', '', '', ''
        );

        insert into auth.identities (
          id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at
        ) values (
          gen_random_uuid(), user_id, user_id::text,
          jsonb_build_object('sub', user_id::text, 'email', emails[idx]),
          'email', now(), now(), now()
        );

        insert into public.users (id, full_name, role, department_id)
        values (user_id, full_names[idx], role_name, dept_ids[d]);
      end loop;
    end loop;
  end;

  ------------------------------------------------------------------
  -- KPIs + submissions, per department per period
  ------------------------------------------------------------------
  for d in 1..5 loop
    if dept_names[d] = 'Sales' then
      kpi_names := array['Monthly Revenue', 'New Deals Closed', 'Customer Retention Rate'];
      kpi_types := array['currency', 'number', 'percentage'];
      kpi_targets := array[5000000, 20, 90];
      kpi_ratios := array[1.00, 0.95, 0.85];
    elsif dept_names[d] = 'Finance' then
      kpi_names := array['Cost Savings', 'Invoices Processed', 'Budget Variance Accuracy'];
      kpi_types := array['currency', 'number', 'percentage'];
      kpi_targets := array[1000000, 200, 95];
      kpi_ratios := array[1.05, 0.90, 0.82];
    elsif dept_names[d] = 'Marketing' then
      kpi_names := array['Leads Generated', 'Campaign ROI', 'Social Engagement Rate'];
      kpi_types := array['number', 'percentage', 'percentage'];
      kpi_targets := array[500, 150, 8];
      kpi_ratios := array[1.00, 1.00, 0.50];
    elsif dept_names[d] = 'Operations' then
      kpi_names := array['Process Efficiency', 'Defect Rate Reduction', 'Safety Audit Passed'];
      kpi_types := array['percentage', 'percentage', 'boolean'];
      kpi_targets := array[90, 20, 1];
      kpi_ratios := array[0.70, 0.60, 1.00];
    else -- Logistics
      kpi_names := array['On-time Delivery Rate', 'Inventory Accuracy', 'Shipping Cost Reduction'];
      kpi_types := array['percentage', 'percentage', 'percentage'];
      kpi_targets := array[95, 98, 15];
      kpi_ratios := array[0.50, 0.50, 0.50];
    end if;

    for p in 1..6 loop
      for k in 1..3 loop
        target := kpi_targets[k];
        ratio := kpi_ratios[k];

        -- KPI1 -> employee 1, KPI2 -> employee 2, KPI3 -> department-level (manager submits)
        if k = 1 then
          assigned_user := emp1_ids[d];
        elsif k = 2 then
          assigned_user := emp2_ids[d];
        else
          assigned_user := null;
        end if;
        submitting_user := coalesce(assigned_user, manager_ids[d]);

        kpi_id := gen_random_uuid();
        insert into kpis (id, name, data_type, target_value, department_id, assigned_to, period)
        values (kpi_id, kpi_names[k], kpi_types[k], target, dept_ids[d], assigned_user, periods[p]);

        if kpi_types[k] = 'boolean' then
          actual := case when factors[p] >= 0.94 then 1 else 0 end;
        else
          actual := round(target * ratio * factors[p], 2);
        end if;

        -- Skip the June (current period) submission for the Operations
        -- department-level KPI to demonstrate a < 100% submission rate
        -- (Operations is already critical, so this doesn't change its band).
        if periods[p] = '2026-06' and dept_names[d] = 'Operations' and k = 3 then
          continue;
        end if;

        insert into submissions (kpi_id, user_id, actual_value, notes, period, submitted_at)
        values (kpi_id, submitting_user, actual, null, periods[p], now());
      end loop;
    end loop;
  end loop;
end $$;
