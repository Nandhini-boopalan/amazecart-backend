const mongoose = require('mongoose');

const connectDatabase = () => {
    const dbURI = process.env.DB_LOCAL_URI;
    if (!dbURI) {
        console.error("DB_LOCAL_URI environment variable is not set.");
        return;
    }

    mongoose.connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(con => {
        console.log(`MongoDB is connected to the host: ${con.connection.host}`);
    })
}

module.exports = connectDatabase;
