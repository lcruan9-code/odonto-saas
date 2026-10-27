/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // A clínica de demonstração antiga ("clinica-exemplo") virou "sorriso-pleno";
    // mantém funcionando os links já compartilhados.
    return [
      { source: "/clinica/clinica-exemplo", destination: "/clinica/sorriso-pleno", permanent: false },
      { source: "/agendar/clinica-exemplo", destination: "/agendar/sorriso-pleno", permanent: false },
    ];
  },
};

module.exports = nextConfig;
