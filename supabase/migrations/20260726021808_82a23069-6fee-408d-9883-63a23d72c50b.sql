
-- ============ 1. REVIEW MODERATION ============
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_reason text,
  ADD COLUMN IF NOT EXISTS moderated_by uuid,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

-- Public listing must only see non-hidden reviews. Drop old select policies and recreate.
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read non-hidden reviews"
  ON public.reviews FOR SELECT
  USING (hidden = false OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.review_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, reporter_id)
);
GRANT SELECT, INSERT ON public.review_flags TO authenticated;
GRANT ALL ON public.review_flags TO service_role;
ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can flag reviews" ON public.review_flags
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Reporter or admin can see flag" ON public.review_flags
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can resolve flags" ON public.review_flags
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ 2. BOOKING MESSAGES ============
CREATE TABLE public.booking_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_messages_booking ON public.booking_messages(booking_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.booking_messages TO authenticated;
GRANT ALL ON public.booking_messages TO service_role;
ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
  ON public.booking_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_messages.booking_id
      AND (b.guest_id = auth.uid() OR b.host_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participants can send messages"
  ON public.booking_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_messages.booking_id
        AND (b.guest_id = auth.uid() OR b.host_id = auth.uid())
    )
  );

CREATE POLICY "Recipient can mark read"
  ON public.booking_messages FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_messages.booking_id
      AND (b.guest_id = auth.uid() OR b.host_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_messages.booking_id
      AND (b.guest_id = auth.uid() OR b.host_id = auth.uid())
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_messages;
ALTER TABLE public.booking_messages REPLICA IDENTITY FULL;

-- ============ 3. NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own notifications update" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: new booking -> notify host
CREATE OR REPLACE FUNCTION public.notify_host_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    NEW.host_id,
    'booking_new',
    CASE WHEN NEW.status = 'confirmed' THEN 'Ny direktbokning' ELSE 'Ny bokningsförfrågan' END,
    'Incheckning ' || to_char(NEW.check_in, 'YYYY-MM-DD') || ', ' || NEW.nights || ' nätter, ' || NEW.total_price || ' kr',
    '/vard/bokningar'
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_host_new_booking ON public.bookings;
CREATE TRIGGER trg_notify_host_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_host_new_booking();

-- Trigger: new message -> notify counterpart
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host uuid;
  v_guest uuid;
  v_recipient uuid;
BEGIN
  SELECT host_id, guest_id INTO v_host, v_guest FROM public.bookings WHERE id = NEW.booking_id;
  v_recipient := CASE WHEN NEW.sender_id = v_host THEN v_guest ELSE v_host END;
  IF v_recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (
      v_recipient,
      'message_new',
      'Nytt meddelande',
      LEFT(NEW.body, 120),
      CASE WHEN NEW.sender_id = v_host THEN '/mina-bokningar' ELSE '/vard/bokningar' END
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_new_message ON public.booking_messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON public.booking_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ============ 4. WISHLISTS ============
CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_private boolean NOT NULL DEFAULT true,
  share_slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT ON public.wishlists TO anon;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wishlist_members (
  wishlist_id uuid NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (wishlist_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_members TO authenticated;
GRANT ALL ON public.wishlist_members TO service_role;
ALTER TABLE public.wishlist_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wishlist_cabins (
  wishlist_id uuid NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  cabin_id uuid NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  added_by uuid NOT NULL,
  note text,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (wishlist_id, cabin_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_cabins TO authenticated;
GRANT SELECT ON public.wishlist_cabins TO anon;
GRANT ALL ON public.wishlist_cabins TO service_role;
ALTER TABLE public.wishlist_cabins ENABLE ROW LEVEL SECURITY;

-- Membership check function (avoids recursion in RLS)
CREATE OR REPLACE FUNCTION public.is_wishlist_member(_wishlist uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.wishlists w WHERE w.id = _wishlist AND w.owner_id = _user
  ) OR EXISTS (
    SELECT 1 FROM public.wishlist_members m WHERE m.wishlist_id = _wishlist AND m.user_id = _user
  );
$$;

CREATE POLICY "Owner or member reads wishlist"
  ON public.wishlists FOR SELECT
  USING (
    owner_id = auth.uid()
    OR public.is_wishlist_member(id, auth.uid())
    OR (is_private = false AND share_slug IS NOT NULL)
  );
CREATE POLICY "Owner writes wishlist"
  ON public.wishlists FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates wishlist"
  ON public.wishlists FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes wishlist"
  ON public.wishlists FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Members visible to member/owner"
  ON public.wishlist_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.owner_id = auth.uid())
  );
CREATE POLICY "Owner adds members"
  ON public.wishlist_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.owner_id = auth.uid()));
CREATE POLICY "Owner or self removes"
  ON public.wishlist_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.owner_id = auth.uid())
  );

CREATE POLICY "Members read cabins"
  ON public.wishlist_cabins FOR SELECT
  USING (
    public.is_wishlist_member(wishlist_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.wishlists w WHERE w.id = wishlist_id AND w.is_private = false AND w.share_slug IS NOT NULL)
  );
CREATE POLICY "Members add cabins"
  ON public.wishlist_cabins FOR INSERT TO authenticated
  WITH CHECK (added_by = auth.uid() AND public.is_wishlist_member(wishlist_id, auth.uid()));
CREATE POLICY "Members remove cabins"
  ON public.wishlist_cabins FOR DELETE TO authenticated
  USING (public.is_wishlist_member(wishlist_id, auth.uid()));

-- ============ 5. GIFT CARDS ============
CREATE TABLE public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  amount_ore integer NOT NULL CHECK (amount_ore > 0),
  redeemed_ore integer NOT NULL DEFAULT 0 CHECK (redeemed_ore >= 0),
  currency text NOT NULL DEFAULT 'SEK',
  issued_to_email text,
  issued_to_name text,
  message text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','void','expired')),
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (redeemed_ore <= amount_ore)
);
CREATE INDEX idx_gift_cards_code ON public.gift_cards(code);
GRANT SELECT ON public.gift_cards TO authenticated;
GRANT ALL ON public.gift_cards TO service_role;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gift cards"
  ON public.gift_cards FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Redemptions
CREATE TABLE public.gift_card_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES public.gift_cards(id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  redeemed_by uuid NOT NULL,
  amount_ore integer NOT NULL CHECK (amount_ore > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gift_card_redemptions TO authenticated;
GRANT ALL ON public.gift_card_redemptions TO service_role;
ALTER TABLE public.gift_card_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own or admin redemptions"
  ON public.gift_card_redemptions FOR SELECT
  TO authenticated
  USING (redeemed_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Lookup + redeem RPC (SECURITY DEFINER; callable by authenticated users)
CREATE OR REPLACE FUNCTION public.lookup_gift_card(_code text)
RETURNS TABLE (id uuid, remaining_ore integer, currency text, status text, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gc.id, (gc.amount_ore - gc.redeemed_ore)::int, gc.currency, gc.status, gc.expires_at
  FROM public.gift_cards gc
  WHERE gc.code = upper(trim(_code));
$$;
REVOKE ALL ON FUNCTION public.lookup_gift_card(text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_gift_card(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_gift_card(_code text, _booking_id uuid, _amount_ore integer)
RETURNS TABLE (redemption_id uuid, applied_ore integer, remaining_ore integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card public.gift_cards;
  v_apply int;
  v_red uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _amount_ore <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  SELECT * INTO v_card FROM public.gift_cards WHERE code = upper(trim(_code)) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_card.status <> 'active' THEN RAISE EXCEPTION 'inactive'; END IF;
  IF v_card.expires_at IS NOT NULL AND v_card.expires_at < now() THEN RAISE EXCEPTION 'expired'; END IF;

  -- Confirm caller is guest on the booking
  IF NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = _booking_id AND b.guest_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  v_apply := LEAST(_amount_ore, v_card.amount_ore - v_card.redeemed_ore);
  IF v_apply <= 0 THEN RAISE EXCEPTION 'depleted'; END IF;

  UPDATE public.gift_cards SET redeemed_ore = redeemed_ore + v_apply, updated_at = now() WHERE id = v_card.id;
  INSERT INTO public.gift_card_redemptions (gift_card_id, booking_id, redeemed_by, amount_ore)
  VALUES (v_card.id, _booking_id, auth.uid(), v_apply)
  RETURNING id INTO v_red;

  RETURN QUERY SELECT v_red, v_apply, (v_card.amount_ore - v_card.redeemed_ore - v_apply)::int;
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_gift_card(text, uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_gift_card(text, uuid, integer) TO authenticated;

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS set_updated_at_wishlists ON public.wishlists;
CREATE TRIGGER set_updated_at_wishlists BEFORE UPDATE ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_gift_cards ON public.gift_cards;
CREATE TRIGGER set_updated_at_gift_cards BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
