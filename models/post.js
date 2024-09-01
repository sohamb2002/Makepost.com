const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');

const postSchema = mongoose.Schema({
    title: { type: String, required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true // Automatically fills in the user's username when a new post is created.
    },
    body: { type: String, required: true },
    username: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likes:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
});

// Apply the autopopulate plugin
postSchema.plugin(autopopulate);

module.exports = mongoose.model('Post', postSchema);
