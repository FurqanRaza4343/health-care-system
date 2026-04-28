
-- Image analyses
CREATE TABLE public.image_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  title TEXT,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'other',
  ai_result JSONB,
  confidence NUMERIC,
  urgency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Image analyses view own" ON public.image_analyses FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Image analyses insert own" ON public.image_analyses FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Image analyses update own" ON public.image_analyses FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Doctors view all image analyses" ON public.image_analyses FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors update image analyses" ON public.image_analyses FOR UPDATE USING (public.has_role(auth.uid(), 'doctor'));

CREATE TRIGGER update_image_analyses_updated_at BEFORE UPDATE ON public.image_analyses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments view own (patient)" ON public.appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Appointments insert own (patient)" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Appointments update own (patient)" ON public.appointments FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Doctors view all appointments" ON public.appointments FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors update appointments" ON public.appointments FOR UPDATE USING (public.has_role(auth.uid(), 'doctor'));

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id, scheduled_at);

-- Prescriptions
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_id UUID,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prescriptions patient view own" ON public.prescriptions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors view all prescriptions" ON public.prescriptions FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors create prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);
CREATE POLICY "Doctors update own prescriptions" ON public.prescriptions FOR UPDATE USING (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);

CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id, issued_at DESC);

-- Lab orders
CREATE TABLE public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  tests TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'ordered',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab orders patient view own" ON public.lab_orders FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors view all lab orders" ON public.lab_orders FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors create lab orders" ON public.lab_orders FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);
CREATE POLICY "Doctors update lab orders" ON public.lab_orders FOR UPDATE USING (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);

CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket for medical images (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-images', 'medical-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Patients upload own medical images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Patients view own medical images"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Patients update own medical images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'medical-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Patients delete own medical images"
ON storage.objects FOR DELETE
USING (bucket_id = 'medical-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors view all medical images"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-images' AND public.has_role(auth.uid(), 'doctor'));
