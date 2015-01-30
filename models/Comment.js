var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
  drink_id: String,
  comment: String,
  posted_at: Date,
  profile: {
    email: { type: String },
    name: { type: String },
    picture: { type: String }
  }
});

module.exports = mongoose.model('Comment', commentSchema);
