'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { supabase } from '../../SupabaseClient';
import InputField from '../../../components/inputField';
import PasswordField from '../../../components/PasswordField';
import GenderSelect from '../../../components/GenderSelect';

function RegisterPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1: Form, 2: Didit Verification
  const [formData, setFormData] = useState(null);
  const [verifiedSessionId, setVerifiedSessionId] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const gender = watch('gender');
  const searchParams = useSearchParams();

  // Detect if user comes from successful verification
  useEffect(() => {
    const verified = searchParams.get('verified');
    const sessionId = searchParams.get('session_id');
    
    console.log('🔍 Detecting verification parameters:', { verified, sessionId });
    console.log('🔍 Complete URL:', window.location.href);
    console.log('🔍 All parameters:', Object.fromEntries(searchParams.entries()));
    
    if (verified === 'true' && sessionId) {
      console.log('✅ Verification detected, processing...');
      setVerifiedSessionId(sessionId);
      setSuccess('Didit verification completed successfully');
      
      // If we have saved form data, complete registration automatically
      const savedFormData = localStorage.getItem('registration_form_data');
      const verificationData = localStorage.getItem('didit_verification');
      
      console.log('📋 Saved form data:', { 
        hasFormData: !!savedFormData,
        hasVerificationData: !!verificationData,
        formData: savedFormData ? JSON.parse(savedFormData) : null,
        verificationData: verificationData ? JSON.parse(verificationData) : null
      });
      
      if (savedFormData) {
        const parsedFormData = JSON.parse(savedFormData);
        setFormData(parsedFormData);
        
        console.log('🔄 Starting automatic registration in 2 seconds...');
        
        // Complete registration automatically
        setTimeout(() => {
          handleCompleteRegistration(parsedFormData, sessionId);
        }, 2000);
      } else {
        console.error('❌ No saved form data found');
        setError('Error: No form data found');
      }
    }
  }, [searchParams]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate that gender is female
      if (data.gender !== 'female') {
        setError('Only female registrations are allowed');
        setLoading(false);
        return;
      }

      // Save form data in localStorage
      localStorage.setItem('registration_form_data', JSON.stringify(data));

      // Save form data and proceed to step 2
      setFormData(data);
      setStep(2);
      setSuccess('Form completed. Proceeding to verification...');

    } catch (error) {
      console.error('Error in validation:', error);
      setError('Internal server error');
    }

    setLoading(false);
  };

  const handleCompleteRegistration = async (formData, sessionId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🚀 Starting complete registration process...');
      
      // 1. Look for existing verification in user_verifications
      let verification = null;
      
      if (sessionId) {
        console.log('🔍 Looking for verification by session_id:', sessionId);
        
        const { data: verificationData, error: verificationError } = await supabase
          .from('user_verifications')
          .select('*')
          .eq('session_id', sessionId)
          .eq('verification_provider', 'didit')
          .single();
        
        if (verificationData) {
          console.log('✅ Verification found in user_verifications:', verificationData);
          verification = {
            sessionId: sessionId,
            status: verificationData.status,
            verifiedAt: verificationData.created_at,
            email: formData.email
          };
        } else if (verificationError && verificationError.code !== 'PGRST116') {
          console.warn('⚠️ Error looking for verification:', verificationError);
        }
      }

      // 2. If not found, look in localStorage as fallback
      if (!verification) {
        const verificationData = localStorage.getItem('didit_verification');
        
        if (verificationData) {
          try {
            verification = JSON.parse(verificationData);
            console.log('✅ Verification data found in localStorage:', verification);
          } catch (e) {
            console.warn('⚠️ Error parsing verification data:', e);
          }
        }
      }

      console.log('🔧 Data for registration:', { 
        formData, 
        sessionId, 
        verification,
        hasVerificationData: !!verification
      });

      // Validate required data
      if (!formData.email || !formData.password) {
        throw new Error('Missing required data for registration');
      }

      console.log('📤 Creating user in Supabase Auth...');
      console.log('📤 Data to send to Supabase:', {
        email: formData.email,
        password: formData.password ? '***' : 'MISSING',
        metadata: {
          full_name: formData.fullName,
          user_name: formData.userName,
          gender: formData.gender,
          didit_verified: verification ? true : false,
          didit_session_id: sessionId,
          verification_status: verification?.status || 'approved'
        }
      });

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_name: formData.userName,
            gender: formData.gender,
            didit_verified: verification ? true : false,
            didit_session_id: sessionId,
            verification_status: verification?.status || 'approved'
          }
        }
      });

      console.log('📥 Supabase response:', { authData, authError });

      if (authError) {
        console.error('❌ Error in Supabase registration:', authError);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        console.log('✅ User created in Supabase Auth:', authData.user);
        
        // Create profile manually in case trigger doesn't work
        try {
          console.log('📝 Creating profile manually...');
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              full_name: formData.fullName,
              user_name: formData.userName,
              email: formData.email,
              gender: formData.gender,
              verification_status: verification?.status || 'approved',
              didit_verified: verification ? true : false,
              didit_session_id: sessionId,
              didit_verification_data: verification ? {
                session_id: sessionId,
                status: verification.status,
                verified_at: verification.verifiedAt
              } : null
            })
            .select()
            .single();
          
          if (profileError) {
            console.warn('⚠️ Error creating profile manually:', profileError);
            // Continue even if it fails, trigger should have created it
          } else {
            console.log('✅ Profile created manually:', profileData);
          }
        } catch (profileError) {
          console.warn('⚠️ Error in manual profile creation:', profileError);
        }
        
        // Verify that profile exists
        try {
          console.log('🔍 Verifying profile exists...');
          
          const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (checkError) {
            console.error('❌ Error verifying profile:', checkError);
          } else if (existingProfile) {
            console.log('✅ Profile verified:', existingProfile);
          } else {
            console.error('❌ Profile not found after creation');
          }
        } catch (verifyError) {
          console.error('❌ Error in profile verification:', verifyError);
        }
        
        // Clean up temporary data
        localStorage.removeItem('registration_form_data');
        localStorage.removeItem('didit_verification');
        localStorage.removeItem('pending_verification');
        
        setSuccess('Registration completed successfully! Redirecting to dashboard...');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard?verified=true');
        }, 2000);
      } else {
        console.error('❌ No user received from Supabase');
        setError('Error: Could not create user');
      }

    } catch (error) {
      console.error('❌ Error completing registration:', error);
      setError('Error completing registration: ' + error.message);
    }

    setLoading(false);
  };

  const handleDiditVerification = async () => {
    setLoading(true);
    setError('');

    try {
      // Save email temporarily in localStorage to recover it in callback
      localStorage.setItem('pending_verification', formData.email);
      
      console.log('🔧 Starting Didit verification...');
      
      // Create session using our backend endpoint (avoids CORS)
      const response = await fetch('/api/didit/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          userId: `shebn_${Date.now()}`,
          metadata: {
            full_name: formData.fullName,
            user_name: formData.userName,
            gender: formData.gender
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Session created with Didit:', data);
        
        // Use the verification URL provided by Didit
        if (data.verification_url) {
          console.log('🔗 Redirecting to Didit:', data.verification_url);
          
          // Open Didit in a new window/tab
          const diditWindow = window.open(data.verification_url, '_blank', 'width=800,height=600');
          
          // Show message to user
          setSuccess('Verification started. Complete the process in the new window and then return here.');
          
          // Check periodically if verification was completed
          const checkVerification = setInterval(async () => {
            try {
              const checkResponse = await fetch(`/api/didit/check-verification?email=${encodeURIComponent(formData.email)}&session_id=${data.session_id}`);
              if (checkResponse.ok) {
                const checkData = await checkResponse.json();
                if (checkData.verified) {
                  clearInterval(checkVerification);
                  setSuccess('Verification completed! Proceeding with registration...');
                  setTimeout(() => {
                    handleCompleteRegistration(formData, data.session_id);
                  }, 2000);
                }
              }
            } catch (error) {
              console.warn('Error checking status:', error);
            }
          }, 5000); // Check every 5 seconds
          
        } else {
          throw new Error('No verification URL received from Didit');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error creating Didit session:', response.status, errorData);
        throw new Error(errorData.error || `Error creating session: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error starting Didit verification:', error);
      setError('Error starting verification: ' + error.message);
      setLoading(false);
    }
  };

  const handleSkipDidit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create user in Supabase Auth with Didit verification if available
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_name: formData.userName,
            gender: formData.gender,
            didit_verified: verifiedSessionId ? true : false,
            didit_session_id: verifiedSessionId || null
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        const successMessage = verifiedSessionId 
          ? 'Registration successful with Didit verification. Redirecting...'
          : 'Registration successful. Redirecting to verification...';
        
        setSuccess(successMessage);
        
        // Redirect based on whether verification exists or not
        setTimeout(() => {
          if (verifiedSessionId) {
            router.push('/');
          } else {
            router.push('/auth/verification');
          }
        }, 2000);
      }

    } catch (error) {
      console.error('Error in registration:', error);
      setError('Internal server error');
    }

    setLoading(false);
  };

  // Render step 1: Registration form
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1718] text-white">
        <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
          
          <div className="text-center">
            <h1 className="text-4xl font-semibold">Register</h1>
            <p className="text-gray-400 mt-2">Join the community of women in Web3</p>
          </div>

          <form 
            onSubmit={handleSubmit(handleFormSubmit)} 
            className="w-full max-w-md space-y-6"
          >
            
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <InputField 
              label="Full Name"
              name="fullName"
              register={register}
              rules={{ required: "Full name is required" }}
              error={errors.fullName}
            />

            <InputField 
              label="Username"
              name="userName"
              register={register}
              rules={{ required: "Username is required" }}
              error={errors.userName}
            />

            <InputField 
              label="Email"
              name="email"
              type="email"
              register={register}
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email"
                }
              }}
              error={errors.email}
            />

            <GenderSelect 
              register={register}
              error={errors.gender}
            />

            <PasswordField 
              label="Password"
              name="password"
              register={register}
              rules={{ 
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              }}
              error={errors.password}
            />

            <PasswordField 
              label="Confirm Password"
              name="confirmPassword"
              register={register}
              rules={{ 
                required: "Confirm password is required",
                validate: (value) => {
                  const password = watch('password');
                  return value === password || "Passwords don't match";
                }
              }}
              error={errors.confirmPassword}
            />

            <div className="w-full">
              <button 
                type="submit" 
                disabled={loading || gender !== 'female'} 
                className={`w-full rounded-2xl py-3 font-semibold transition-colors ${
                  loading || gender !== 'female'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-[#ff29d7] text-white hover:bg-[#de69c7]'
                }`}
              >
                {loading ? "Validating..." : "CONTINUE"}
              </button>
            </div>

            {gender && gender !== 'female' && (
              <div className="text-center text-red-400 text-sm">
                This platform is designed exclusively for women
              </div>
            )}

          </form>

          <div className="text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <a href="/auth/login" className="text-[#ff29d7] hover:text-[#de69c7]">
                Sign in
              </a>
            </p>
          </div>

        </div>
      </div>
    );
  }

  // Render step 2: Didit Verification
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1718] text-white">
      <div className="w-full md:w-1/2 py-12 px-6 flex flex-col gap-6 justify-center items-center">
        
        <div className="text-center">
          <h1 className="text-4xl font-semibold">Identity Verification</h1>
          <p className="text-gray-400 mt-2">Complete verification with Didit to continue</p>
        </div>

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg w-full max-w-md">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg w-full max-w-md">
            {error}
          </div>
        )}

        <div className="w-full max-w-md space-y-6">
          
          <div className="bg-[#2d2e33] rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-center">Why do we verify your identity?</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Ensure you are a real woman</li>
              <li>• Protect the community from fake users</li>
              <li>• Comply with platform requirements</li>
              <li>• Quick and secure process</li>
            </ul>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleDiditVerification}
              disabled={loading}
              className={`w-full rounded-2xl py-3 font-semibold transition-colors ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-[#ff29d7] text-white hover:bg-[#de69c7]'
              }`}
            >
              {loading ? "Starting verification..." : "VERIFY WITH DIDIT"}
            </button>

            <button 
              onClick={handleSkipDidit}
              disabled={loading}
              className={`w-full rounded-2xl py-3 font-semibold transition-colors border ${
                loading
                  ? 'border-gray-600 text-gray-400 cursor-not-allowed'
                  : 'border-[#ff29d7] text-[#ff29d7] hover:bg-[#ff29d7] hover:text-white'
              }`}
            >
              {loading ? "Processing..." : "CONTINUE WITHOUT VERIFICATION"}
            </button>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setStep(1)}
              className="text-gray-400 hover:text-[#ff29d7] text-sm"
            >
              ← Back to form
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#1a1718] text-white flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-gray-300">Loading registration...</p>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}