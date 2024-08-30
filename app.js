const express = require("express");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const Post = require("./models/post.js");
const path = require("path");

const app = express();

async function main() {
    await mongoose.connect("mongodb://localhost:27017/Makepost");
    console.log("Connected to MongoDB");
}

main().catch(error => console.error("Error connecting to MongoDB:", error));

app.set("view engine", "ejs");
app.use(methodOverride('_method')); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/posts", (req, res) => {
    Post.find()
        .then(posts => {
            res.render("home", { posts });
            console.log("Posts fetched successfully");
        })
        .catch(error => console.error("Error fetching posts:", error));
});

app.get("/posts/new", (req, res) => {
    res.render("new");
});
app.get("/",(req,res)=>{
    res.render("Login")
})
app.post("/posts", (req, res) => {
    const { username, title, body } = req.body;
    const createdpost = new Post({
        username,
        title,
        body,
        createdAt: Date.now()
    });

    createdpost.save()
        .then(() => {
            res.redirect("/posts");
            console.log("Post saved successfully");
        })
        .catch(error => console.error("Error saving post:", error));
});

app.get("/posts/:id", (req, res, next) => {
    Post.findById(req.params.id)
        .then(post => {
            if (!post) {
                return res.status(404).send("Post not found");
            }
            console.log("Post fetched successfully");
            res.render("view", { post });
        })
        .catch(error => {
            next(error);
        });
});

app.get("/posts/edit/:id", (req, res) => {
    Post.findById(req.params.id)
        .then(post => {
            if (!post) {
                return res.status(404).send("Post not found");
            }
            res.render("edit", { post });
            console.log("Post fetched successfully");
        })
        .catch(error => console.error("Error fetching post:", error));
});

app.put("/posts/:id", (req, res) => {
    const { username, title, body } = req.body;
    Post.findByIdAndUpdate(req.params.id, { username, title, body }, { new: true })
        .then(() => {
            res.redirect(`/posts/${req.params.id}`);
            console.log("Post updated successfully");
        })
        .catch(error => console.error("Error updating post:", error));
});

app.delete("/posts/:id",(req,res)=>{
    Post.findByIdAndDelete(req.params.id).then(
        () => {
            res.redirect("/posts");
            console.log("Post deleted successfully");
        }
    ).catch(
        error => console.error("Error deleting post:", error)
    )
})




app.listen(3000, () => console.log("Server is running on port 3000"));
