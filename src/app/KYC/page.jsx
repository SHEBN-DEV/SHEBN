"use client";
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';  //verificacion de campos
import { useRouter } from 'next/navigation';
import { supabase } from '../SupabaseClient';
import InputField from '../components/inputField';


const KYC = () => {
    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm();

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success'); 

    const router = useRouter();
    
    // Función para manejar el envío del formulario KYC
    const handleKYCSubmit = async (data) => {
        try {
            console.log('Starting KYC form submission...');
            
            // Obtener el usuario autenticado actual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                console.error('User authentication error:', userError);
                setToastMessage('Debes iniciar sesión para completar el KYC');
                setToastType('error');
                setShowToast(true);
                router.push('/login');
                return;
            }
            
            const userId = user.id;
            console.log('User authenticated:', userId);
            
            await handleKYCSubmission(userId, data);
            
            setToastMessage('KYC enviado exitosamente!');
            setToastType('success');
            setShowToast(true);
            
            // Limpiar el formulario
            reset();
            
            // Redirigir después de un éxito
            setTimeout(() => {
                router.push('/MyProfile');
            }, 3000);
            
        } catch (error) {
            console.error('Error submitting KYC:', error);
            setToastMessage(`Error enviando KYC: ${error.message}`);
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };
    
     //KYC Submission
     const handleKYCSubmission = async (userId, data) => {
        try {
            console.log('Starting KYC submission for user:', userId);
            
            const dniFile = data.dniPhoto[0];
            const faceFile = data.faceId[0];

            // Verificar que los archivos existen
            if (!dniFile || !faceFile) {
                throw new Error("Archivos requeridos no encontrados");
            }

            console.log('Uploading DNI file...');
            const dniFileName = `dni/${userId}_${Date.now()}_${dniFile.name}`;
            const dniUpload = await supabase.storage.from('kyc').upload(dniFileName, dniFile);
            
            if (dniUpload.error) {
                console.error("Error uploading DNI:", dniUpload.error);
                throw new Error(`Error subiendo DNI: ${dniUpload.error.message}`);
            }

            console.log('Uploading face file...');
            const faceFileName = `face/${userId}_${Date.now()}_${faceFile.name}`;
            const faceUpload = await supabase.storage.from('kyc').upload(faceFileName, faceFile);
            
            if (faceUpload.error) {
                console.error("Error uploading face:", faceUpload.error);
                throw new Error(`Error subiendo foto: ${faceUpload.error.message}`);
            }

            console.log('Getting public URLs...');
            const dniUrl = supabase.storage.from('kyc').getPublicUrl(dniFileName).data.publicUrl;
            const faceIdUrl = supabase.storage.from('kyc').getPublicUrl(faceFileName).data.publicUrl;

            console.log('Inserting KYC data...');
            
            // Primero verificar si ya existe un registro para este usuario
            const { data: existingKYC, error: checkError } = await supabase
                .from('kyc_data')
                .select('id')
                .eq('id', userId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error("Error checking existing KYC:", checkError);
                throw new Error(`Error verificando KYC existente: ${checkError.message}`);
            }

            let kycError;
            if (existingKYC) {
                // Actualizar registro existente
                const { error } = await supabase
                    .from('kyc_data')
                    .update({
                        document_number: data.documentNumber,
                        dni_photo_url: dniUrl,
                        face_id_url: faceIdUrl,
                        wallet_address: data.wallet,
                        x_account: data.xAccount,
                        status: 'pending',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                kycError = error;
            } else {
                // Insertar nuevo registro
                const { error } = await supabase
                    .from('kyc_data')
                    .insert([
                        {
                            id: userId,
                            document_number: data.documentNumber,
                            dni_photo_url: dniUrl,
                            face_id_url: faceIdUrl,
                            wallet_address: data.wallet,
                            x_account: data.xAccount,
                            status: 'pending',
                            created_at: new Date().toISOString()
                        },
                    ]);
                kycError = error;
            }

            if (kycError) {
                console.error("Error saving KYC:", kycError);
                // Si falla el guardado en la base de datos, limpiar los archivos subidos
                try {
                    await supabase.storage.from('kyc').remove([dniFileName, faceFileName]);
                } catch (cleanupError) {
                    console.error("Error cleaning up uploaded files:", cleanupError);
                }
                throw new Error(`Error guardando KYC: ${kycError.message}`);
            }

            console.log('KYC submission completed successfully');
            
        } catch (error) {
            console.error("Error in handleKYCSubmission:", error);
            throw error; // Re-lanzar el error para que se maneje en el componente padre
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center">
            
            <form onSubmit={handleSubmit(handleKYCSubmit)} className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
                <div className="flex flex-col gap-8 justify-center items-center text-center">
                    <p className="text-4xl font-semibold">
                        KYC Verification
                    </p>
                    <p className='text-base'>
                        Complete your identity verification to access your account.
                    </p>
                </div>

                <div className="w-full flex flex-col gap-6">
                    {/* Dirrecion publica */}
                    <InputField label="Wallet Address" name="wallet" register={register} 
                    rules={{ required: "Wallet address is required" }}
                    error={errors.wallet} />

                    {/* Cuenta X */}
                    <InputField label="X Account" name="xAccount" register={register} 
                    rules={{ required: "X account is required"}}
                    error={errors.xAccount} />

                    {/* Document Number */}
                    <InputField label="Document Number" name="documentNumber" register={register} 
                    rules={{required: "Document number is required"}}
                    error={errors.documentNumber} />

                    
                    {/* Foto del DNI */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Upload DNI Photo</label>
                        <input type="file" accept="image/*" {...register("dniPhoto", { required: "DNI photo is required" })} 
                        className="block w-full text-sm text-white bg-black border border-white rounded-lg py-2 cursor-pointer focus:outline-none" />
                        {errors.dniPhoto && <p className="text-[#ff29d7] text-sm mt-1">{errors.dniPhoto.message}</p>}
                    </div>

                    {/* Selfie */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Upload Face ID (Selfie)</label>
                        <input type="file" accept="image/*" {...register("faceId", { required: "Face ID is required" })} 
                        className="block w-full text-sm text-white bg-black border border-white rounded-lg py-2 cursor-pointer focus:outline-none" />
                        {errors.faceId && <p className="text-[#ff29d7] text-sm mt-1">{errors.faceId.message}</p>}
                    </div>

                </div>

                <div className="w-full flex justify-end py-5 pr-8">
                    <p>
                        Already A Member?{" "}
                        <a href="/login" className="text-[#ff29d7] hover:text-[#de69c7]">Log In</a>
                    </p>
                </div>

                <div className="w-full">
                    <button type="submit" className="w-full bg-black border border-white rounded-2xl py-3 font-semibold hover:bg-[#ff29d7] hover:text-white">
                        SUBMIT KYC VERIFICATION
                    </button>
                </div>
            </form>

            {showToast && (
                <div className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg z-50 transition-all duration-300 
                ${toastType === 'success' ? 'bg-[#ff29d7]' : 'bg-red-500'} text-white`}>
                    {toastMessage}
                </div>
            )}

        </div>
    )
}

export default KYC;
