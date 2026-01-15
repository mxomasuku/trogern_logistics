import { Link } from "react-router-dom";

interface PublicNavbarProps {
  textPrimaryClassName: string;
  cardBorderClassName: string;
  accentColor: string;
  buttonPrimaryColor: string;
}

export function PublicNavbar({
  textPrimaryClassName,
  cardBorderClassName,
  accentColor,
  buttonPrimaryColor,
}: PublicNavbarProps) {
  return (
    <header className={`relative z-20 border-b ${cardBorderClassName}`}>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">

        {/* HIGHLIGHT: brand now links home */}
        <Link
          to="/"
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg bg-black/20">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </div>
          <span
            className={`text-lg font-semibold tracking-tight ${textPrimaryClassName}`}
          >
            trogern
          </span>
        </Link>

        {/* HIGHLIGHT: center nav links */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link
            to="/product-overview"
            className={`${textPrimaryClassName} hover:opacity-70 transition`}
          >
            Product overview
          </Link>

          {/* HIDDEN: Book a demo link
          <Link
            to="/book-a-demo"
            className={`${textPrimaryClassName} hover:opacity-70 transition`}
          >
            Book a demo
          </Link>
          */}
        </nav>

        {/* right-side auth actions */}
        <div className="flex gap-3 text-sm">
          <Link
            to="/login"
            className={`hidden md:block px-4 py-2 rounded-full ${textPrimaryClassName} hover:bg-white/10`}
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="px-5 py-2 rounded-full font-medium text-white shadow-lg hover:shadow-xl transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: buttonPrimaryColor }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}