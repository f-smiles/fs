export default function sitemap() {
  const baseUrl = "https://freysmiles.com";

  const routes = [
    "",
    "/locations",
    "/locations/allentown",
    "/locations/bethlehem",
    "/locations/lehighton",
    "/locations/schnecksville",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}