ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_cabin_id_fkey,
  ADD CONSTRAINT bookings_cabin_id_fkey
    FOREIGN KEY (cabin_id) REFERENCES public.cabins(id) ON DELETE CASCADE;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_host_id_fkey,
  ADD CONSTRAINT bookings_host_id_fkey
    FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_guest_id_fkey,
  ADD CONSTRAINT bookings_guest_id_fkey
    FOREIGN KEY (guest_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.cabin_images
  DROP CONSTRAINT IF EXISTS cabin_images_cabin_id_fkey,
  ADD CONSTRAINT cabin_images_cabin_id_fkey
    FOREIGN KEY (cabin_id) REFERENCES public.cabins(id) ON DELETE CASCADE;