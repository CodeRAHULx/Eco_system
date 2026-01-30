// Simple test file to debug incident reporting
const http = require("http");

const postData = JSON.stringify({
  type: "pothole",
  description: "Test pothole on main road",
  location: {
    lat: 28.6139,
    lng: 77.209,
  },
  media: {
    photos: [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    ],
    video: null,
  },
});

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/incidents/report",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", data);
  });
});

req.on("error", (e) => {
  console.error("Request error:", e.message);
});

req.write(postData);
req.end();
