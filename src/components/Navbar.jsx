"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../SupabaseClient";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_name, verification_status, gender")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    };

    fetchUserAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          const { data: profileData } = await supabase
            .from("profiles")
            .select("user_name, verification_status, gender")
            .eq("id", session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleOptionClick = async (value) => {
    if (value === "logout") {
      await supabase.auth.signOut();
      router.push("/auth/login");
    }
    if (value === "verify") {
      router.push("/auth/verification");
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Profiles", href: "/profileFriends" },
    { label: "Projects", href: "/Projects" },
    { label: "Apply", href: "#" },
    { label: "Forum", href: "#" },
    { label: "Contact us", href: "#", special: true },
  ];

  return (
    <nav className="w-full bg-[#191617] text-white py-4 px-8 flex items-center justify-between font-[var(--font-montserrat)]">
      <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-start">
        <img 
          src="/images/home/logo 1.png" 
          alt="SHEBN Logo" 
          className="h-12 w-auto select-none" 
          draggable="false"
        />
        <nav className="hidden sm:flex gap-4 sm:gap-8 text-sm sm:text-base font-light flex-wrap">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`px-2 py-1 rounded transition hover:bg-[#FF29D7]/70 hover:text-white ${
                link.special ? "bg-[#FF29D7]/70 text-white font-medium hover:bg-[#FF29D7]/90" : ""
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      
      <div className="flex space-x-4 items-center">
        {user && profile ? (
          <>
            <img 
              className="relative left-6 w-10 h-10 rounded-full" 
              src="/images/profile/woman.jpg" 
              alt={profile.user_name} 
            />
            <div className="bg-[#4B4242] rounded-r-lg px-6 py-1 text-sm font-semibold">
              {profile.user_name}
              <select 
                onChange={(e) => handleOptionClick(e.target.value)} 
                className="bg-[#4B4242] text-white w-6 outline-none"
                defaultValue=""
              >
                <option value="" disabled></option>
                {profile.verification_status !== 'completed' && profile.gender === 'female' && (
                  <option value="verify">VERIFY IDENTITY</option>
                )}
                <option value="logout">LOG OUT</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <Link href="/auth/login">
              <button className="px-4 sm:px-6 py-2 border border-white rounded-full font-semibold hover:bg-white hover:text-black transition text-xs sm:text-base">
                LOG IN
              </button>
            </Link>
            <Link href="/auth/register">
              <button className="px-4 sm:px-6 py-2 border border-white rounded-full font-semibold hover:bg-white hover:text-black transition text-xs sm:text-base">
                SIGN UP
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;