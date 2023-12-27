const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const dns = require("dns");

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Basic Configuration
const port = process.env.PORT || 8080;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

function isUrlValid(str) {
  const pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR IP (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$", // fragment locator
    "i"
  );
  return pattern.test(str);
}

app.post("/api/shorturl", async (req, res) => {
  // Check if the url is valid
  try {
    const url = new URL(req.body.url);
    console.log("URL", isUrlValid(url));
    if (!isUrlValid(url)) {
      return res.json({
        error: "invalid url",
      });
    }
    dns.lookup(url.hostname, async (err, address, family) => {
      if (err) {
        console.log(err);
        return res.json({
          error: "invalid url",
        });
      }

      const newUrl = new Url({
        original_url: req.body.url,
        short_url: Math.floor(Math.random() * 10000),
      });
      await newUrl.save();

      res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url,
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: err.message,
    });
  }
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const url = await Url.findOne({ short_url: req.params.short_url });
  if (!url) {
    return res.status(404).json({
      error: "No short URL found for the given input",
    });
  }
  res.redirect(url.original_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
