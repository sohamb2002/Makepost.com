const express = require("express");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const Post = require("./models/post.js");
const path = require("path");
const cookieParser=require("cookie-parser");
const app = express();
const User=require("./models/user.js");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

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
app.use(cookieParser());
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

app.get("/login", (req, res) => {
    res.render("login");
});


app.get("/",(req,res)=>{
    res.render("signup")
  })
  app.post("/posts", isLoggedIn, async (req, res) => {
    try {
        const { username, title, body } = req.body;
        const userId = req.user.userId; // Get userId from req.user

        if (!userId) {
            return res.status(400).send("User ID is required.");
        }

        // Create a new post
        const createdpost = new Post({
            username,
            title,
            body,
            user: userId, // Use userId to populate the user field
            createdAt: Date.now()
        });

        // Save the post to the database
        await createdpost.save();

        // Find the user and push the post ID to their posts array
        const user = await User.findById(userId);
        if (user) {
            user.posts.push(createdpost._id); // Use createdpost._id
            await user.save(); // Save the updated user document
        } else {
            return res.status(404).send("User not found.");
        }

        console.log("Post saved successfully and added to the user's posts array");

        res.redirect("/posts");

    } catch (error) {
        console.error("Error saving post or updating user:", error);
        res.status(500).send("Internal Server Error");
    }
});



// Ensure this path is correct

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists with this email.');
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(hashedPassword); // For debugging purposes

        // Create a new user
        const user = new User({
            username,
            email,
            password: hashedPassword // Save the hashed password
        });

        // Save the user to the database
        await user.save();
        console.log('User created successfully');

        // Create a JWT token
        const token = jwt.sign({ email, userId: user._id }, "secret-key", { expiresIn: '1h' });

        // Set token as a cookie
        res.cookie("token", token, { httpOnly: true }); // Secure cookies for production

        // Redirect after successful signup
        res.redirect('/posts');
        
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            // Passwords match, create a JWT token
            const token = jwt.sign({ email, userId: user._id }, "secret-key", { expiresIn: '1h' });

            // Set the token as a cookie (you can also send it in the response body)
            res.cookie("token", token, { httpOnly: true });

            // Redirect to posts page or wherever you want after successful login
            return res.redirect("/posts");
        } else {
            // Passwords do not match
            return res.status(401).send("Incorrect password");
        }
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).send("Internal Server Error");
    }
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

app.get("/logout",(req,res)=>{
    res.cookie("token", "", { expires: new Date(0) });

    res.redirect("/login");
})

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/login");
    }
    
    try {
        // Verify the token
        const data = jwt.verify(token, "secret-key");
        req.user = data; // Attach user data to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.redirect("/login");
    }
}




app.listen(3000, () => console.log("Server is running on port 3000"));
