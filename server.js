require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dbURI = process.env.DB_URI;
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

(async (req, res) => {
  await mongoose.connect(dbURI);
  console.log('connected to db')
})();

const subSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String
}, { _id: false })

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [subSchema]
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

const findExerciseById = async (id) => {
  const result = await User.findById(id, '_id username log');
  return result;
}

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  try {
    let result = await findExerciseById(id);
    let logArray = result.log;
    
    if (from) {
      logArray = logArray.filter(log => new Date(log.date) > new Date(from));
    }

    if (to) {
      logArray = logArray.filter(log => new Date(log.date) < new Date(to));
    }

    if (limit) {
      logArray = logArray.slice(0, limit);
    }

    const count = { count: logArray.length }
    result.log = logArray;
    const response = { ...result._doc, ...count }
    res.send(response);
  } catch (err) {
    res.json({ error: err.message })
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
