var mongoose = require('mongoose');

var drinkSchema = new mongoose.Schema({
  id: String,
  rate: {
    rate: { type: Number, default: 0.0 },
    based: { type: Number, default: 0 },
    ratings: {
      one: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      five: { type: Number, default: 0 }
    }
  },
  price: { type: Number, default: 0 },
  totalComments: { type: Number, default: 0 },
  comments: Array
});

module.exports = mongoose.model('Drink', drinkSchema);
