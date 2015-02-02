var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
  drink_id: String,
  comment: String,
  posted_at: Date,
  email: { type: String },
  profile: {
    name: { type: String },
    picture: { type: String }
  }
});

module.exports = mongoose.model('Comment', commentSchema);
