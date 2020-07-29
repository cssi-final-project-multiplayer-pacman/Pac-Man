const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    roomId: String,
    users: [{id: String, score: Number}],
    pacmanIndex: Number
});

module.exports = mongoose.model('Game', gameSchema);
