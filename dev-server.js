const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting development servers...\n");

// Start Express server
const expressServer = spawn("node", ["server.js"], {
  cwd: __dirname,
  stdio: "inherit",
});

// Start esbuild dev server with watch mode
const esbuildServer = spawn(
  "npx",
  ["esbuild", "js/*.js", "--bundle", "--outdir=dist", "--watch"],
  {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  }
);

console.log("📦 esbuild: Building and watching JavaScript files...");
console.log("🌐 Express: Starting API server...\n");

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down servers...");
  expressServer.kill("SIGINT");
  esbuildServer.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down servers...");
  expressServer.kill("SIGTERM");
  esbuildServer.kill("SIGTERM");
  process.exit(0);
});

// Handle server exits
expressServer.on("exit", (code) => {
  if (code !== 0) {
    console.error(`❌ Express server exited with code ${code}`);
  }
});

esbuildServer.on("exit", (code) => {
  if (code !== 0) {
    console.error(`❌ esbuild server exited with code ${code}`);
  }
});
