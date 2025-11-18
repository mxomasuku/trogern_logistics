import React from "react";

export default function LandingPage(): React.JSX.Element {
  return (
    <div
      className="min-h-screen flex relative text-white"
      style={{ backgroundColor: "#0F172A" }}
    >
 
      <div className="hidden md:block md:w-6/12 lg:w-5/12 relative z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                180deg,
                #1D4ED8 0%,
                #6366F1 40%,
                #93C5FD 100%
              )
            `,
          }}
        />
      </div>

      <div className="flex-1 bg-[#0F172A] relative z-0" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="pointer-events-auto w-full max-w-md px-4">
          <div className="bg-white text-black rounded-3xl shadow-2xl border border-gray-200 px-10 py-12">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(29,78,216,0.15)" }}
              >
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: "#1D4ED8" }}
                ></div>
              </div>
              <span className="ml-3 text-xl font-semibold tracking-tight">
                trogern
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold text-center mb-6 text-black">
              Log in or sign up
            </h1>

            {/* Google Button */}
            <button
              className="w-full h-11 mb-3 rounded-full text-white text-sm font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1D4ED8" }}
            >
              <span className="h-4 w-4 rounded-sm bg-white" />
              Continue with Google
            </button>

            {/* SSO */}
            <button className="w-full h-11 mb-4 rounded-full border border-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-100">
              <span className="h-4 w-4 rounded-sm border border-gray-300" />
              Continue with SSO
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4 text-xs text-gray-400">
              <div className="flex-1 h-px bg-gray-300" />
              or
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Socials */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {["GH", "", "in", "f"].map((label) => (
                <button
                  key={label}
                  className="h-10 w-10 border border-gray-300 rounded-full flex items-center justify-center text-xs font-semibold text-gray-500 hover:bg-gray-100"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Email CTA */}
            <button
              className="w-full text-center text-sm font-medium hover:underline"
              style={{ color: "#1D4ED8" }}
            >
              Continue with email address
            </button>

            {/* Terms */}
            <p className="mt-6 text-[11px] leading-snug text-center text-gray-500">
              By logging in or signing up, you agree to Trogern’s Terms &
              Conditions and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
      {/* ========== END FLOATING LAYER ========== */}

      {/* CONTENT: right testimonial + top bar */}
      <div className="absolute inset-0 flex flex-col justify-between z-10 pointer-events-none">
        <header className="flex items-center justify-end px-6 py-6 text-sm text-gray-300 pointer-events-auto">
          <button className="hover:text-white transition">← Go back</button>
        </header>

        <section className="flex-1 flex items-center justify-end pr-12 text-gray-300 max-w-xl ml-auto pointer-events-none">
          <div>
            <p className="text-lg leading-relaxed mb-6">
              "Trogern enables fleet owners to move from chaos and guesswork to
              fully-automated visibility. The transition is unreal."
            </p>
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-full"
                style={{ backgroundColor: "rgba(147,197,253,0.25)" }}
              />
              <div>
                <p className="text-sm font-semibold">Imaginary Person</p>
                <p className="text-xs text-gray-400">Fleet Ops Lead</p>
              </div>
            </div>
          </div>
        </section>

        <button
          className="fixed bottom-5 right-5 h-12 w-12 rounded-full text-white shadow-xl flex items-center justify-center text-xl pointer-events-auto"
          style={{ backgroundColor: "#1D4ED8" }}
        >
          ?
        </button>
      </div>
    </div>
  );
}