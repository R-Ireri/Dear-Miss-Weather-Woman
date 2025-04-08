const http = require("http");
const fs = require("fs");
const requests = require("requests");

const homeFile = fs.readFileSync("home.html", "utf-8");

const replaceVal = (temval, orgval) => {
  let temperature = temval.replace("{%tempval%}", orgval.main.temp);
  temperature = temperature.replace("{%tempmin%}", orgval.main.temp_min);
  temperature = temperature.replace("{%tempmax%}", orgval.main.temp_max);
  temperature = temperature.replace("{%city%}", orgval.name);
  temperature = temperature.replace("{%country%}", orgval.sys.country);
  temperature = temperature.replace("{%tempstatus%}", orgval.weather[0].main);
  return temperature;
};

const server = http.createServer((req, res) => {
  if (req.url == "/") {
    // Step 1: Get IP from request headers (use fallback for localhost)
    const ip = req.headers["x-forwarded-for"] || "182.75.41.234"; // example fallback IP

    // Step 2: Use IP geolocation API to get city
    requests(`http://ip-api.com/json/${ip}`)
      .on("data", (geoData) => {
        const location = JSON.parse(geoData);
        const city = location.city || "delhi"; // fallback

        // Step 3: Fetch weather using the detected city
        requests(
          `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=cffecceafab4795d98bde4086c0332bb`
        )
          .on("data", (chunk) => {
            const objdata = JSON.parse(chunk);
            const arrData = [objdata];

            const realTimeData = arrData
              .map((val) => replaceVal(homeFile, val))
              .join(" ");
            res.write(realTimeData);
          })
          .on("end", (err) => {
            if (err) console.log("Weather API error:", err);
            res.end();
          });
      })
      .on("end", (err) => {
        if (err) console.log("Geo API error:", err);
      });
  }
});

server.listen(8000, "127.0.0.1");
