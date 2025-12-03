/*
  # Disable Rate Limiting
  
  Update check_rate_limit function to always return true (allow all requests).
  Rate limiting is disabled to improve workflow and prevent blocking legitimate orders.
*/

-- Update function to always allow requests
DROP FUNCTION IF EXISTS check_rate_limit(text, text, integer, boolean);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address text,
  p_action_type text,
  p_cooldown_seconds integer DEFAULT 30,
  p_is_admin boolean DEFAULT false
)
RETURNS boolean AS $$
BEGIN
  -- Rate limiting disabled - always allow
  RETURN true;
END;
$$ LANGUAGE plpgsql;

