"use client";

const GenderSelect = ({ label, name, register, rules, error }) => (
  <div className="w-full flex flex-col justify-center items-start">
    <label htmlFor={name} className="w-full bg-[#2d2e33] rounded-t-2xl p-1 pl-4 text-sm">
      {label}
    </label>
    <select
      name={name}
      id={name}
      {...register(name, rules)}
      className={`w-full bg-[#2d2e33] rounded-b-2xl p-3 outline-0 text-white ${
        error ? "border border-[#ff29d7]" : ""
      }`}
    >
      <option value="">Selecciona tu género</option>
      <option value="female">Femenino</option>
      <option value="male">Masculino</option>
      <option value="other">Otro</option>
      <option value="prefer_not_to_say">Prefiero no decir</option>
    </select>
    {error && <span className="text-[#ff29d7] text-sm mt-1">{error.message}</span>}
  </div>
);

export default GenderSelect; 