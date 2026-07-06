import { useEffect, useRef, useState } from "react";
import { searchCities } from "../lib/openMeteo.js";
import { useToast } from "../context/ToastContext.jsx";

// City search with debounced Open-Meteo geocoding suggestions.
export default function SearchBox({ onSelect, placeholder = "Search for a city…", compact = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const toast = useToast();
  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const onClickAway = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchCities(query.trim());
        setResults(found);
        setOpen(true);
        setActive(-1);
      } catch (err) {
        toast.error(err.message, "City search failed");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, toast]);

  const choose = (city) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    onSelect(city);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={`searchbox${compact ? " searchbox-compact" : ""}`} ref={boxRef}>
      <span className="search-glyph" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Search for a city"
        role="combobox"
        aria-expanded={open}
      />
      {loading && <span className="search-spinner" aria-hidden="true" />}

      {open && results.length > 0 && (
        <ul className="search-results" role="listbox">
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={i === active ? "active" : ""}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(c)}
              >
                <strong>{c.name}</strong>
                <span>
                  {[c.region, c.country].filter(Boolean).join(", ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && results.length === 0 && query.trim().length >= 2 && (
        <ul className="search-results">
          <li className="search-empty">No cities matched “{query.trim()}”.</li>
        </ul>
      )}
    </div>
  );
}