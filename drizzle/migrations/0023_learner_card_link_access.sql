CREATE OR REPLACE FUNCTION public.learner_card(p_profile uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid;
BEGIN
  SELECT user_id INTO u FROM profiles WHERE id = p_profile;
  IF u IS NULL THEN RETURN NULL; END IF;
  RETURN learner_card_for(u) || jsonb_build_object(
    'is_me', u = auth.uid(),
    'is_friend', EXISTS (SELECT 1 FROM learner_friends f WHERE f.user_id = auth.uid() AND f.friend_id = u));
END $$;
GRANT EXECUTE ON FUNCTION public.learner_card(uuid) TO anon, authenticated;