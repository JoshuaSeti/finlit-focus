alter table public.learner_feature_unlocks add constraint learner_feature_unlocks_profile_feature unique (profile_id, feature_key);
alter table public.holdings add constraint holdings_profile_instrument unique (profile_id, instrument_id);
alter table public.net_worth_snapshots add constraint net_worth_snapshots_profile_date unique (profile_id, snapshot_date);