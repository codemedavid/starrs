/*
  # Add Admin Bypass to Rate Limit Function
  
  Update check_rate_limit function to accept an optional is_admin parameter.
  When is_admin is true, the function will bypass rate limiting and return true immediately.
*/

-- Drop existing function
DROP FUNCTION IF EXISTS check_rate_limit(text, text, integer);

-- Create updated function with admin bypass
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address text,
  p_action_type text,
  p_cooldown_seconds integer DEFAULT 30,
  p_is_admin boolean DEFAULT false
)
RETURNS boolean AS $$
DECLARE
  last_action_time timestamptz;
  cooldown_end timestamptz;
BEGIN
  -- If admin, bypass rate limiting
  IF p_is_admin = true THEN
    RETURN true;
  END IF;
  
  -- Get the most recent action for this IP and action type
  SELECT MAX(timestamp) INTO last_action_time
  FROM rate_limit_logs
  WHERE ip_address = p_ip_address
    AND action_type = p_action_type
    AND expires_at > now();
  
  -- If no recent action, allow
  IF last_action_time IS NULL THEN
    -- Record this action
    INSERT INTO rate_limit_logs (ip_address, action_type, expires_at)
    VALUES (p_ip_address, p_action_type, now() + (p_cooldown_seconds || ' seconds')::interval);
    RETURN true;
  END IF;
  
  -- Calculate when cooldown ends
  cooldown_end := last_action_time + (p_cooldown_seconds || ' seconds')::interval;
  
  -- If cooldown has passed, allow
  IF now() >= cooldown_end THEN
    -- Record this action
    INSERT INTO rate_limit_logs (ip_address, action_type, expires_at)
    VALUES (p_ip_address, p_action_type, now() + (p_cooldown_seconds || ' seconds')::interval);
    RETURN true;
  END IF;
  
  -- Still in cooldown, deny
  RETURN false;
END;
$$ LANGUAGE plpgsql;

