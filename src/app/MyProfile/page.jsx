import React from "react";
import Sidebar from "../../components/Sidebar";

const content = [
    {
    name: 'Maria Torre',
    userName: 'mariatorre5',
    experience: 'Software Developer, XYZ Tech Solutions Company in January 2020 - April 2023',
    about: 'I am a software developer passionate about creating innovative and efficient solutions, with a solid background in Systems Engineering and experience in technology such as JavaScript and Python. I specialize in the design and development of web and mobile applications, prioritizing functionality, user experience, and scalability.',
    location: 'Medellin, Colombia',
    portfolio: 'Upload your portfolio'
    }

];

const MyProfile = () => {

    return(
        <div className="min-h-screen flex justify-center bg-[#1a1718] text-white">
            {/* Bloque 1 */}
            <Sidebar />

            {/* Bloque 2 */}
            <div className="md:w-full">
                <img src="/images/profile/fondo-inferior.png" alt="Fondo decorativo" />
                <div className="md:relative flex items-start bottom-9 left-0">
                    <div className="w-1/2 flex items-center pl-4">
                        <div className="md:relative w-1/2 md:w-1/4">
                            <img className="w-15 h-15 md:w-30 md:h-30 rounded-full border-4 border-[#1a1718] " src="/images/profile/woman.jpg" alt="Photo" />
                            <div className="w-3 h-3 md:w-5 md:h-5 bg-green-500 rounded-full md:absolute bottom-162 left-8 md:bottom-0 md:left-4"></div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{content[0].name}</p>
                            <p className="text-sm">{content[0].userName}</p>
                        </div>
                    </div>
                    <div className="w-1/2 md:relative flex justify-center pt-4">
                        <button className="bg-black border border-white rounded-3xl px-8 py-2 text-sm font-semibold hover:bg-[#ff29d7] md:px-14 md:py-2">
                            EDIT PROFILE
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-10 p-4 md:py-10">
                    <div className="">
                        <p className="text-lg font-semibold">Experience</p>
                        <p className="text-base">{content[0].experience}</p>
                    </div>
                    <div className="w-5/6 border-b-2 border-gray-500 mx-auto"></div>
                    <div className="flex items-start justify-between">
                        <div className="w-1/2 flex flex-col gap-2">
                            <p className="text-lg font-semibold">About Me</p>
                            <p className="text-base">
                                {content[0].about}
                            </p>
                            <a href="#" className="text-lg font-bold text-[#ff29d7] pt-6 hover:underline">Read More</a>
                        </div>
                        <div className="w-2/5 flex flex-col gap-2">
                            <p className="text-lg font-semibold">Location</p>
                            <div className="flex items-center gap-x-2">
                                <img className="w-10 h-10 rounded-full" src="/images/profile/fondo-inferior.png" alt="Pais" />
                                <p>{content[0].location}</p>
                            </div>
                            <p className="text-lg font-semibold pt-4">Portfolio</p>
                            <a href="" className="text-base hover:text-[#ff29d7]">{content[0].portfolio}</a>
                        </div>
                    </div>
                </div>
            
            </div>
        </div>
    );
};

export default MyProfile;
