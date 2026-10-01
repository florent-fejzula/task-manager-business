import { Link } from "react-router-dom";

// Compact page heading shared by all screens: title, optional tagline
// (hidden on phones), optional back link, optional extra row via children.
function PageHeader({ title, subtitle, backTo, backLabel, children }) {
  return (
    <header className="mb-3 text-center">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
        {title}
      </h1>
      <div className="w-10 h-0.5 mx-auto mt-1.5 bg-accent rounded"></div>
      {subtitle && (
        <p className="mt-1 text-sm text-gray-500 hidden sm:block">{subtitle}</p>
      )}
      {backTo && (
        <Link
          to={backTo}
          className="inline-block mt-1.5 text-sm text-blue-600 hover:underline"
        >
          {backLabel}
        </Link>
      )}
      {children}
    </header>
  );
}

export default PageHeader;
