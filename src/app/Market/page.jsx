"use client";

import React from "react";
import { useState } from 'react';

const MarketForm = () => {
    const [formData, setFormData] = useState({
        roles: [],
        teamMember: '',
        teamSize: '',
        womenInTeam: '',
        leadership: '',
        funding: '',
        challenges: [],
        opportunities: [],
        location: '',
        personalChallenges: [],
        technicalBarriers: [],
        ecosystemNeeds: [],
        negativeExperience: '',
        contact: '',
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMultiSelect = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
            ? prev[field].filter(v => v !== value)
            : [...prev[field], value],
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
        // Aquí se envian los datos
    };

return (
    <div className="min-h-screen w-full bg-[#191617] text-black flex flex-col items-center pt-12">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md space-y-6">
            <h1 className="text-2xl text-[#FF29D7] font-bold text-center">Estado del ecosistema Web3 para mujeres</h1>
            
            {/* Pregunta 1 */}
            <div>
                <label className="block font-semibold mb-2">1. ¿Cuál es tu rol principal en Web3 hoy?</label>
                {[
                "Fundador/a o co-fundador/a de un proyecto",
                "Parte de un equipo técnico",
                "Trabajador/a en una empresa Web3",
                "Inversor/a o advisor",
                "Estudiante o en formación",
                "Otro (especificar)"
                ].map(role => (
                <label key={role} className="block">
                    <input type="checkbox" value={role} checked={formData.roles.includes(role)} onChange={() => handleMultiSelect('roles', role)} className="mr-2" />
                    {role}
                </label>
                ))}
                
                {/* Mostrar input si se seleccionó "Otro (especificar)" */}
                {formData.roles.includes("Otro (especificar)") && (
                    <input
                    type="text"
                    placeholder="Especificá tu rol"
                    value={formData.otherRole || ""}
                    onChange={(e) => handleChange("otherRole", e.target.value)}
                    className="mt-2 w-full bg-[#D9D9D966] rounded-md p-2 outline-0"
                    />
                )}

            </div>
            
            {/* Pregunta 2 */}
            <div>
                <label className="block font-semibold mb-2">2. ¿Formás parte de un equipo Web3 actualmente?</label>
                {["Sí", "No"].map(option => (
                <label key={option} className="block">
                    <input type="radio" name="teamMember" value={option} checked={formData.teamMember === option} onChange={() => handleChange('teamMember', option)} className="mr-2" />
                    {option}
                </label>
                ))}
            </div>
            
            {/* Pregunta 3 */}
            <div>
                <label className="block font-semibold mb-2">3. ¿Cuántas personas integran tu equipo actual (si aplica)?</label>
                {["1 (soy solo yo)", "2-5", "6-10", "Más de 10"].map(option => (
                <label key={option} className="block">
                    <input type="radio" name="teamSize" value={option} checked={formData.teamSize === option} onChange={() => handleChange('teamSize', option)} className="mr-2" />
                    {option}
                </label>
                ))}
            </div>
            
            {/* Pregunta 4 */}
            <div>
                <label className="block font-semibold mb-2">4. ¿Cuántas mujeres hay en tu equipo actual?</label>
                {["Ninguna", "1", "2-3", "Más de 3", "No sé / Prefiero no decir"].map(option => (
                <label key={option} className="block">
                    <input type="radio" name="womenInTeam" value={option} checked={formData.womenInTeam === option} onChange={() => handleChange('womenInTeam', option)} className="mr-2" />
                    {option}
                </label>
                ))}
            </div>

            {/* Pregunta 5 */}
            <div>
                <label className="block font-semibold mb-2">5. ¿Tu equipo o proyecto tiene alguna mujer en un rol de liderazgo o decisión?</label>
                {["Sí", "No", "No aplica"].map(option => (
                <label key={option} className="block">
                    <input type="radio" name="leadership" value={option} checked={formData.leadership === option} onChange={() => handleChange('leadership', option)} className="mr-2" />
                    {option}
                </label>
                ))}
            </div>
            
            {/* Pregunta 6 */}
            <div>
                <label className="block font-semibold mb-2">6. ¿Recibiste o accediste a algún tipo de financiamiento Web3?</label>
                {["Sí (inversión, grant, beca, etc.)", "Estoy buscando activamente", "Me interesa pero no sé por dónde empezar", "No me interesa el financiamiento"].map(option => (
                <label key={option} className="block">
                    <input type="radio" name="funding" value={option} checked={formData.funding === option} onChange={() => handleChange('funding', option)} className="mr-2" />
                    {option}
                </label>
                ))}
            </div>

            {/* Pregunta 7 */}
            <div>
                <label className="block font-semibold mb-2">7. ¿Qué principales desafíos encontrás al emprender o crecer en Web3? (Seleccioná hasta 3)</label>
                {[
                "Acceder a capital o inversores",
                "Armar un equipo confiable",
                "Conocer el ecosistema / falta de información",
                "Falta de comunidad o red de apoyo",
                "Escalar el proyecto",
                "Otro (especificar)"
                ].map(option => (
                <label key={option} className="block">
                    <input type="checkbox" value={option} checked={formData.challenges.includes(option)} onChange={() => handleMultiSelect('challenges', option)} className="mr-2" />
                    {option}
                </label>
                ))}

                {/* Mostrar input si se seleccionó "Otro (especificar)" */}
                {formData.challenges.includes("Otro (especificar)") && (
                    <input
                    type="text"
                    placeholder="Especificá tu desafío"
                    value={formData.otherchallenges || ""}
                    onChange={(e) => handleChange("otherchallenges", e.target.value)}
                    className="mt-2 w-full bg-[#D9D9D966] rounded-md p-2 outline-0"
                    />
                )}
            </div>

            {/* Pregunta 8 */}
            <div>
                <label className="block font-semibold mb-2">8. ¿Qué tipo de oportunidades valorás más en el ecosistema? (Seleccioná hasta 3)</label>
                {[
                "Formación técnica",
                "Acceso a mentorías",
                "Financiamiento",
                "Networking internacional",
                "Visibilidad de proyectos",
                "Contrataciones / trabajo",
                "Otro (especificar)"
                ].map(option => (
                <label key={option} className="block">
                    <input type="checkbox" value={option} checked={formData.opportunities.includes(option)} onChange={() => handleMultiSelect('opportunities', option)} className="mr-2" />
                    {option}
                </label>
                ))}

                {/* Mostrar input si se seleccionó "Otro (especificar)" */}
                {formData.opportunities.includes("Otro (especificar)") && (
                    <input
                    type="text"
                    placeholder="Especificá la oportunidad"
                    value={formData.otheropportunities || ""}
                    onChange={(e) => handleChange("otheropportunities", e.target.value)}
                    className="mt-2 w-full bg-[#D9D9D966] rounded-md p-2 outline-0"
                    />
                )}
            </div>

            {/* Pregunta 9 */}
            <div>
                <label className="block font-semibold mb-2">9. País y ciudad donde vivís o trabajás</label>
                <input type="text" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full bg-[#D9D9D966] rounded-md p-2 outline-0" />
            </div>

            {/* Pregunta 10 */}
            <div>
                <label className="block font-semibold mb-2">10. ¿Qué desafíos enfrentaste o enfrentás en tu camino dentro del ecosistema Web3? (Podés seleccionar hasta 3)</label>
                {[
                "Falta de información o barreras para entender lo técnico",
                "Acceso limitado a redes de contacto o comunidad",
                "Dificultad para conseguir financiamiento",
                "Falta de visibilidad o espacios donde mostrar lo que hago",
                "Desigualdad de oportunidades dentro de equipos",
                "Cargas personales o tiempo disponible para dedicar al ecosistema",
                "Otro (especificar)"
                ].map(option => (
                <label key={option} className="block">
                    <input type="checkbox" value={option} checked={formData.personalChallenges.includes(option)} onChange={() => handleMultiSelect('personalChallenges', option)} className="mr-2" />
                    {option}
                </label>
                ))}

                {/* Mostrar input si se seleccionó "Otro (especificar)" */}
                {formData.personalChallenges.includes("Otro (especificar)") && (
                    <input
                    type="text"
                    placeholder="Especificá el desafío"
                    value={formData.otherpersonalC || ""}
                    onChange={(e) => handleChange("otherpersonalC", e.target.value)}
                    className="mt-2 w-full bg-[#D9D9D966] rounded-md p-2 outline-0"
                    />
                )}
            </div>

            {/* Pregunta 11 */}
            <div>
                <label className="block font-semibold mb-2">11. ¿Qué obstáculos técnicos o educativos te frenaron o te están frenando actualmente?</label>
                {[
                "Idioma (la mayoría del contenido está en inglés)",
                "Curva de aprendizaje muy alta",
                "Escasez de programas gratuitos o bien estructurados",
                "Falta de acompañamiento o tutores",
                "No saber cómo validar si lo que estoy aprendiendo es útil",
                "Otro (especificar)"
                ].map(option => (
                <label key={option} className="block">
                    <input type="checkbox" value={option} checked={formData.technicalBarriers.includes(option)} onChange={() => handleMultiSelect('technicalBarriers', option)} className="mr-2" />
                    {option}
                </label>
                ))}

                {/* Mostrar input si se seleccionó "Otro (especificar)" */}
                {formData.technicalBarriers.includes("Otro (especificar)") && (
                    <input
                    type="text"
                    placeholder="Especificá el obstáculo"
                    value={formData.othertechnicalB || ""}
                    onChange={(e) => handleChange("othertechnicalB", e.target.value)}
                    className="mt-2 w-full bg-[#D9D9D966] rounded-md p-2 outline-0"
                    />
                )}
            </div>

            {/* Pregunta 12 */}
            <div>
                <label className="block font-semibold mb-2">12. ¿Qué creés que falta en el ecosistema Web3 para que más personas puedan emprender o escalar un proyecto? (Seleccioná hasta 3)</label>
                {[
                "Financiamiento accesible",
                "Mentores con experiencia",
                "Contenido formativo claro y local",
                "Conexiones y redes de apoyo",
                "Visibilidad y difusión",
                "Legalidad y marco regulatorio más claro",
                "Otro"
                ].map(option => (
                <label key={option} className="block">
                    <input type="checkbox" value={option} checked={formData.ecosystemNeeds.includes(option)} onChange={() => handleMultiSelect('ecosystemNeeds', option)} className="mr-2" />
                    {option}
                </label>
                ))}

                {/* Mostrar input si se seleccionó "Otro (especificar)" */}
                {formData.ecosystemNeeds.includes("Otro") && (
                    <input
                    type="text"
                    placeholder="Cual"
                    value={formData.otherecosystemN || ""}
                    onChange={(e) => handleChange("otherecosystemN", e.target.value)}
                    className="mt-2 w-full bg-[#D9D9D966] rounded-md p-2 outline-0"
                    />
                )}                        
            </div>

            {/* Pregunta 13 */}
            <div>
                <label className="block font-semibold mb-2">13. ¿Tuviste alguna experiencia negativa que te haya hecho replantear tu participación en Web3?</label>
                {["Sí, varias veces", "Sí, alguna vez", "No", "Prefiero no responder"].map(option => (
                <label key={option} className="block">
                    <input type="radio" name="negativeExperience" value={option} checked={formData.negativeExperience === option} onChange={() => handleChange('negativeExperience', option)} className="mr-2" />
                    {option}
                </label>
                ))}
            </div>

            {/* Pregunta 14 */}
            <div>
                <label className="block font-semibold mb-2">14. ¿Querés recibir los resultados del estudio y participar de futuras redes o convocatorias?</label>
                <input type="text" placeholder="Ingresá tu mail o @" value={formData.contact} onChange={(e) => handleChange('contact', e.target.value)} className="w-full rounded-md p-2 bg-[#D9D9D966] outline-0" />
            </div>

            <button type="submit" className="bg-black font-bold text-white px-4 py-2 rounded-2xl hover:bg-[#ff29d7]">
                Enviar
            </button>
        </form>
    </div>
  );
};

export default MarketForm;
