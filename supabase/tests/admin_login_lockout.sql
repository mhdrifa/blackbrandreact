BEGIN;

DO $test$
DECLARE
  v_hash text := md5(random()::text || clock_timestamp()::text)
    || md5(random()::text || clock_timestamp()::text);
  v_allowed boolean;
  v_remaining integer;
  v_retry integer;
BEGIN
  PERFORM black_brand.admin_login_reset(v_hash);

  SELECT r.allowed, r.attempts_remaining, r.retry_after_seconds
  INTO v_allowed, v_remaining, v_retry
  FROM black_brand.admin_login_reserve(v_hash) AS r;
  IF NOT v_allowed OR v_remaining <> 2 OR v_retry <> 0 THEN
    RAISE EXCEPTION 'attempt 1 did not pass with two remaining';
  END IF;

  SELECT r.allowed, r.attempts_remaining, r.retry_after_seconds
  INTO v_allowed, v_remaining, v_retry
  FROM black_brand.admin_login_reserve(v_hash) AS r;
  IF NOT v_allowed OR v_remaining <> 1 OR v_retry <> 0 THEN
    RAISE EXCEPTION 'attempt 2 did not pass with one remaining';
  END IF;

  SELECT r.allowed, r.attempts_remaining, r.retry_after_seconds
  INTO v_allowed, v_remaining, v_retry
  FROM black_brand.admin_login_reserve(v_hash) AS r;
  IF NOT v_allowed OR v_remaining <> 0 THEN
    RAISE EXCEPTION 'attempt 3 was not allowed with zero remaining';
  END IF;

  SELECT r.allowed, r.attempts_remaining, r.retry_after_seconds
  INTO v_allowed, v_remaining, v_retry
  FROM black_brand.admin_login_reserve(v_hash) AS r;
  IF v_allowed OR v_remaining <> 0 OR v_retry <= 0 OR v_retry > 900 THEN
    RAISE EXCEPTION 'attempt 4 was not blocked by the active 15-minute lockout';
  END IF;

  SELECT r.allowed, r.attempts_remaining, r.retry_after_seconds
  INTO v_allowed, v_remaining, v_retry
  FROM black_brand.admin_login_reserve(v_hash) AS r;
  IF v_allowed OR v_retry <= 0 OR v_retry > 900 THEN
    RAISE EXCEPTION 'a repeated locked request bypassed the lockout';
  END IF;

  PERFORM black_brand.admin_login_reset(v_hash);
  SELECT r.allowed, r.attempts_remaining, r.retry_after_seconds
  INTO v_allowed, v_remaining, v_retry
  FROM black_brand.admin_login_reserve(v_hash) AS r;
  IF NOT v_allowed OR v_remaining <> 2 OR v_retry <> 0 THEN
    RAISE EXCEPTION 'successful-MFA reset did not clear the attempt window';
  END IF;

  IF has_function_privilege('anon', 'black_brand.admin_login_reserve(text)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'black_brand.admin_login_reserve(text)', 'EXECUTE')
    OR has_function_privilege('anon', 'black_brand.admin_login_reset(text)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'black_brand.admin_login_reset(text)', 'EXECUTE')
    OR has_table_privilege('anon', 'black_brand.admin_login_attempts', 'SELECT')
    OR has_table_privilege('authenticated', 'black_brand.admin_login_attempts', 'SELECT') THEN
    RAISE EXCEPTION 'untrusted roles have direct lockout access';
  END IF;

  IF NOT has_function_privilege('service_role', 'black_brand.admin_login_reserve(text)', 'EXECUTE')
    OR NOT has_function_privilege('service_role', 'black_brand.admin_login_reset(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role is missing RPC execution permission';
  END IF;
END;
$test$;

ROLLBACK;
