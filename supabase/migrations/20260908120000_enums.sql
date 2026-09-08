-- ExpenseBros enums

CREATE TYPE public.member_role AS ENUM ('admin', 'member');

CREATE TYPE public.split_type AS ENUM (
  'equal',
  'percentage',
  'custom_amount',
  'shares'
);

CREATE TYPE public.settlement_status AS ENUM ('pending', 'confirmed');

CREATE TYPE public.recurrence_frequency AS ENUM ('monthly', 'weekly');
