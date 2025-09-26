-- Create RLS policies for the imports bucket to allow temporary file uploads for OCR

-- Allow users to upload files to their own folder in imports bucket
CREATE POLICY "Users can upload to their own OCR folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'imports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'ocr-temp'
);

-- Allow users to read their own uploaded files
CREATE POLICY "Users can read their own OCR files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'imports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'ocr-temp'
);

-- Allow users to delete their own temporary files (for cleanup)
CREATE POLICY "Users can delete their own OCR files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'imports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.foldername(name))[2] = 'ocr-temp'
);

-- Create a function to automatically clean up old temporary files (older than 2 hours)
CREATE OR REPLACE FUNCTION public.cleanup_ocr_temp_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'imports'
    AND name LIKE '%/ocr-temp/%'
    AND created_at < now() - interval '2 hours';
END;
$$;