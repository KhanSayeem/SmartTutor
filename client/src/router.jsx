/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const RouterContext = createContext(null);
const ParamsContext = createContext({});

function currentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

function normalize(path) {
  if (!path) return "/";
  return path.split("?")[0].replace(/\/+$/, "") || "/";
}

function matchPath(pattern, pathname) {
  if (pattern === "*") return {};
  const patternParts = normalize(pattern).split("/").filter(Boolean);
  const pathParts = normalize(pathname).split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }
  return params;
}

export function BrowserRouter({ children }) {
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const handlePop = () => setPath(currentPath());
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const value = useMemo(
    () => ({
      path,
      navigate(to, options = {}) {
        if (options.replace) window.history.replaceState(null, "", to);
        else window.history.pushState(null, "", to);
        setPath(currentPath());
      }
    }),
    [path]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function Link({ to, onClick, children, ...props }) {
  const router = useContext(RouterContext);
  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        router.navigate(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export function NavLink({ to, className, children, ...props }) {
  const router = useContext(RouterContext);
  const isActive = normalize(router.path) === normalize(to);
  const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;
  return (
    <Link to={to} className={resolvedClassName} {...props}>
      {children}
    </Link>
  );
}

export function Route() {
  return null;
}

export function Routes({ children }) {
  const router = useContext(RouterContext);
  const routes = Array.isArray(children) ? children : [children];
  for (const route of routes) {
    if (!route?.props) continue;
    const params = matchPath(route.props.path, router.path);
    if (params) {
      return <ParamsContext.Provider value={params}>{route.props.element}</ParamsContext.Provider>;
    }
  }
  return null;
}

export function Navigate({ to, replace = false }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);
  return null;
}

export function useNavigate() {
  const router = useContext(RouterContext);
  return router.navigate;
}

export function useParams() {
  return useContext(ParamsContext);
}
