// Quick test script
const http = require("http");

const data = JSON.stringify({
  type: "pothole",
  description: "Test pothole",
  location: { lat: 28.6139, lng: 77.209 },
  media: { photos: ["data:image/test"], video: null },
});

const req = http.request(
  {
    hostname: "localhost",
    port: 5000,
    path: "/api/incidents/report",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log("Status:", res.statusCode);
      console.log("Response:", body);
    });
  },
);

req.on("error", (e) => console.error("Error:", e.message));
req.write(data);
req.end();
