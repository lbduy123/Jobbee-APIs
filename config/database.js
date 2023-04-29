const mongoose = require('mongoose');

mongoose.set('strictQuery', false)

const connectDatabase = () => {
  mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(con => {
    console.log('Connected to MongoDB with host: ' + con.connection.host)
  }).catch(err => console.log(err))
}

module.exports = connectDatabase