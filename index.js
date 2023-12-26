const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

console.log(process.env.MONGO_URL);
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model('Url', urlSchema);

app.post('/api/shorturl', async (req, res) => {
  // Check if the url is valid
  try {
    const url = new URL(req.body.url);
    dns.lookup(url.hostname, async (err, address, family) => {
      if (err) {
        return res.status(404).json({
          error: 'Invalid URL'
        });
      }
    });
  } catch (err) {
    return res.status(404).json({
      error: 'Invalid URL'
    });
  }
  const url = new Url({
    original_url: req.body.url,
    short_url: Math.floor(Math.random() * 10000)
  });
  await url.save();
  res.json({
    original_url: url.original_url,
    short_url: url.short_url
  });
}
);

app.get('/api/shorturl/:short_url', async (req, res) => {
  const url = await Url.findOne({ short_url: req.params.short_url });
  if (!url) {
    return res.status(404).json({
      error: 'No short URL found for the given input'
    });
  }
  res.redirect(url.original_url);
})




app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
