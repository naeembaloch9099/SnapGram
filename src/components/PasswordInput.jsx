import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  id,
  name,
  className = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none",
  required = false,
  autoComplete,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete={autoComplete}
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <FiEyeOff className="w-5 h-5" />
        ) : (
          <FiEye className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
