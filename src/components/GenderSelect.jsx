"use client";

const GenderSelect = ({ register, error }) => (
  <div className="w-full flex flex-col justify-center items-start">
    <label htmlFor="gender" className="w-full bg-[#2d2e33] rounded-t-2xl p-1 pl-4 text-sm">
      Gender
    </label>
    <select
      id="gender"
      {...register("gender", { required: "Gender is required" })}
      className={`w-full bg-[#2d2e33] rounded-b-2xl p-3 outline-0 text-white ${
        error ? "border border-[#ff29d7]" : ""
      }`}
    >
      <option value="">Select your gender</option>
      <option value="female">Female</option>
      <option value="male">Male</option>
      <option value="other">Other</option>
      <option value="prefer_not_to_say">Prefer not to say</option>
    </select>
    {error && <span className="text-[#ff29d7] text-sm mt-1">{error.message}</span>}
  </div>
);

export default GenderSelect; 