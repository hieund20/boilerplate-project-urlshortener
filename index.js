require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const app = express();


// Basic Configuration
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('MongoDB URI not found. Check your .env file.');
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.log('Database connection error:', err));

//Create schema
const Schema = mongoose.Schema;
const urlShortenSchema = new Schema({
  originalURL: { type: String, required: true }, // String is shorthand for {type: String}
  shortenedURL: Number
});
const URLShorten = mongoose.model('URLShorten', urlShortenSchema);

const createAndSaveURLModel = (urlModel) => {
  var newItem = new URLShorten({ originalURL: urlModel.originalURL, shortenedURL: urlModel.shortenedURL });
  newItem.save((err) => {
    if (err) return console.error(err);
  });
};

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {
  const originalURL = req.body.url;
  const urlObject = new URL(originalURL);

  dns.lookup(urlObject.hostname, (err, address, family) => {
    if (err) {
      res.json({
        error: 'invalid url'
      })
    }
    else {
      var shortenedURL = Math.floor(Math.random() * 100000).toString();

      createAndSaveURLModel({ originalURL: originalURL, shortenedURL: shortenedURL });

      res.json({
        original_url: originalURL,
        short_url: shortenedURL
      })
    }
  });
});

app.get('/api/shorturl/:shortenedURL', function (req, res) {
  const shortenedURL = req.params.shortenedURL;

  URLShorten.findOne({ shortenedURL: shortenedURL }, (err, data) => {
    if (err) return console.log(err);
    console.log("data", data);
    res.status(301).redirect(data.originalURL);
  })
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
