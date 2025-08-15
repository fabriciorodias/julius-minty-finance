
-- Create a private storage bucket for import files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imports', 
  'imports', 
  false, 
  52428800, -- 50MB limit
  ARRAY['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/x-ofx', 'application/pdf']
);

-- Create RLS policies for the imports bucket
CREATE POLICY "Users can upload their own import files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'imports' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own import files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'imports' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own import files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'imports' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
