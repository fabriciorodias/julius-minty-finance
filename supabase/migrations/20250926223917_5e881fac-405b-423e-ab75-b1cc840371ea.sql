-- Update the imports bucket to allow image files for OCR functionality
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/x-ofx',
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png'
]
WHERE id = 'imports';