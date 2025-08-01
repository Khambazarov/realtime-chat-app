import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import { getTranslations } from "../utils/languageHelper.js";
import { fetchBrowserLanguage } from "../utils/browserLanguage.js";

import robot from "../assets/robot.png";
import {
  EmailIcon,
  EyeClosedIcon,
  EyeOpenedIcon,
  PasswordIcon,
} from "./_AllSVGs";

const browserLanguage = fetchBrowserLanguage();

export const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [translations, setTranslations] = useState(
    getTranslations(browserLanguage)
  );

  async function handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value.toLowerCase().trim();
    const password = e.target.password.value.trim();

    toast.loading(translations.toast.login.waiting);

    const response = await fetch("/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    toast.dismiss();

    if (response.ok && data.isVerified === true) {
      toast.success(translations.toast.login.success);
      setTimeout(() => navigate("/chatarea"), 2000);
    } else if (data.isVerified === false) {
      toast.error(translations.toast.login.errorLoginVerify);
    } else if (response.status === 404) {
      toast.error(translations.toast.login.errorUsernameOrPw);
    } else {
      toast.error(translations.toast.login.errorFailedLogin);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen  p-6 dark:bg-[#1D232A] dark:bg-none bg-gradient-to-r  from-amber-200 to-blue-300">
      <header className="flex items-center justify-between w-full max-w-md bg-gray-700 text-white p-4 rounded-lg shadow-lg">
        <h1 className="text-xl font-bold tracking-wide">Hello, Word!</h1>
        <img className="h-12" src={robot} alt="robot" />
      </header>
      <Toaster />
      <form
        onSubmit={handleLogin}
        className="mt-[2%] mx-auto w-full max-w-md bg-white/25 shadow-lg shadow-blue-900/30 backdrop-blur-md rounded-xl border border-white/20 p-6"
      >
        <h1 className="text-2xl font-bold text-center mb-4 dark:text-white text-black">
          {translations.login.title}
        </h1>

        <label
          htmlFor="email"
          className="block dark:text-gray-300 text-gray-600 font-semibold"
        >
          {translations.login.email}
        </label>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <EmailIcon />
          </div>
          <input
            type="email"
            name="email"
            id="email"
            placeholder={translations.login.emailPlaceholder}
            className="bg-white/10 dark:text-white text-gray-600 border border-gray-500 rounded-lg w-full p-2 ps-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            required
            autoFocus
          />
        </div>

        <label
          htmlFor="password"
          className="block dark:text-gray-300 text-gray-600 font-semibold"
        >
          {translations.login.pwTitle}
        </label>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
            <PasswordIcon />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            placeholder={translations.login.pwPlaceholder}
            minLength={6}
            className="bg-white/10 dark:text-white text-gray-600 border border-gray-500 rounded-lg w-full p-2 ps-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            required
          />
          <div
            className="absolute inset-y-0 end-0 flex items-center pe-3.5 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOpenedIcon /> : <EyeClosedIcon />}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/forgot-pw")}
          className="dark:text-white text-gray-600 text-sm cursor-pointer mb-3 hover:underline"
        >
          {translations.login.forgotPw}
        </button>

        <button
          type="submit"
          className="cursor-pointer w-full bg-blue-500 text-white p-2 rounded-lg font-bold hover:bg-blue-600 transition duration-300"
        >
          {translations.login.loginBtn}
        </button>
      </form>
      <div className="flex justify-end items-center gap-2 mt-4">
        <Link
          to="/register"
          className="dark:text-white text-gray-600 text-sm  tracking-wider border-b hover:border-b-neutral transition duration-500"
        >
          {translations.login.notYetRegistered}
        </Link>
      </div>

      <div className="flex justify-end items-center gap-2 mt-4">
        <Link
          to="/register/verify"
          className="dark:text-white text-gray-600 text-sm  tracking-wider border-b hover:border-b-neutral transition duration-500"
        >
          {translations.login.notYetVerified}
        </Link>
      </div>
    </div>
  );
};
