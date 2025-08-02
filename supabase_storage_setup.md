# Configuración de Supabase para KYC

## 1. Configurar la tabla kyc_data

Ve a tu dashboard de Supabase y ejecuta el SQL del archivo `kyc_table_setup.sql` en el SQL Editor.

## 2. Configurar el bucket de almacenamiento

1. Ve a **Storage** en tu dashboard de Supabase
2. Crea un nuevo bucket llamado `kyc`
3. Configura las políticas de acceso:

### Política para subir archivos:
```sql
CREATE POLICY "Users can upload KYC files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Política para ver archivos:
```sql
CREATE POLICY "Users can view their own KYC files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Política para actualizar archivos:
```sql
CREATE POLICY "Users can update their own KYC files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'kyc' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 3. Verificar configuración

Después de configurar todo, prueba el formulario KYC. Si sigues teniendo problemas, revisa la consola del navegador para ver errores específicos.

## 4. Problemas comunes

- **Error 403**: Verifica que las políticas RLS estén configuradas correctamente
- **Error de bucket no encontrado**: Asegúrate de que el bucket `kyc` existe
- **Error de tabla no encontrada**: Ejecuta el SQL para crear la tabla `kyc_data` 