require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dbURI = process.env.DB_URI || env.DB_URI;
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

(async (req, res) => {
  await mongoose.connect(dbURI);
  console.log('connected to db')
})();

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [{ description: String, duration: Number, date: String }]
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
  .post(async (req, res) => {
    if (!req.body.username) return res.json({ error: 'username empty' });
    const user = new User(req.body);

    try {
      const result = await user.save();
      res.json({
        username: result.username,
        _id: result._id
      })
    } catch (err) {
      res.json({ error: err.message })
    }
  })
  .get(async (req, res) => {
    try {
      const result = await User.find({}, 'username _id');
      res.json(result);
    } catch (err) {
      res.json({ error: err.message })
    }
  });

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  let date;
  if (!req.body.date) date = new Date().toDateString()
  else date = new Date(req.body.date).toDateString()
  let data = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: date
  }
  try {
    const result = await User.findByIdAndUpdate(id, {
      $push: { log: data }
    }, { select: "_id username" })

    const resultToSend = { ...data, ...result._doc };
    res.json(resultToSend);
  } catch (err) {
    res.json({ error: err.message })
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  try {
    const result = await User.findById(id, '_id username log count');
    const count = result.log.length;
    const data = { ...result._doc, count }
    res.json(data);
  } catch (err) {
    res.json({ error: err.message })
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
