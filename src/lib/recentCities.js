// Last few cities the user picked, persisted across visits.

const KEY = "aurora-recent-cities";
const MAX = 5;

export function getRecentCities() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberCity(city) {
  const slim = {
    id: city.id,
    name: city.name,
    region: city.region ?? "",
    country: city.country ?? "",
    latitude: city.latitude,
    longitude: city.longitude,
  };
  const list = [slim, ...getRecentCities().filter((c) => c.id !== slim.id)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full/blocked — recents are a nicety, not a requirement
  }
  return list;
}
