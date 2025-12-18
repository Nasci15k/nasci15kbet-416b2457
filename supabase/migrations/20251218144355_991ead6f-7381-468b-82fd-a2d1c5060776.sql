-- Add new columns to profiles for enhanced registration
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bonus_code TEXT,
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS kyc_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS kyc_approved_by UUID;

-- Create KYC documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'id_front', 'id_back', 'selfie'
  document_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejected_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.kyc_documents
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.kyc_documents
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all documents" ON public.kyc_documents
FOR ALL USING (is_admin());

-- Create winners settings table
CREATE TABLE IF NOT EXISTS public.winners_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT true,
  auto_generate BOOLEAN DEFAULT true,
  display_count INTEGER DEFAULT 10,
  min_amount NUMERIC DEFAULT 100,
  max_amount NUMERIC DEFAULT 5000,
  refresh_interval INTEGER DEFAULT 30, -- seconds
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.winners_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view winners settings" ON public.winners_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage winners settings" ON public.winners_settings
FOR ALL USING (is_admin());

-- Create winners table for manual/recorded wins
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  game_name TEXT NOT NULL,
  game_image TEXT,
  amount NUMERIC NOT NULL,
  is_manual BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active winners" ON public.winners
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage winners" ON public.winners
FOR ALL USING (is_admin());

-- Insert default winners settings
INSERT INTO public.winners_settings (id, is_enabled, auto_generate, display_count, min_amount, max_amount, refresh_interval)
VALUES (gen_random_uuid(), true, true, 10, 100, 5000, 30)
ON CONFLICT DO NOTHING;

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for KYC documents
CREATE POLICY "Users can upload own KYC documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own KYC documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND 
  is_admin()
);