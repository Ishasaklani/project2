if(process.env.NODE_ENV != "production") {
   require('dotenv').config();
}

const express= require("express");
const app= express();
const PORT = process.env.PORT || 8080
const mongoose=require("mongoose");
const path= require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");



const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


//const MONGO_URL ="mongodb://127.0.0.1:27017/wanderlust";
const  dbUrl = process.env.ATLASDB_URL;
main()
.then(()=> {
    console.log("connected to db");
})
.catch((err)=>{
    console.log(err);
});                         //call main function



async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
// Server.js or app.js
app.use('/uploads', express.static('uploads'));


const store  = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600 ,
});

store.on("error", ()=> {
    console.log("ERROR in MONGO SESSION STORE", err);
});


const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 7*24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        httpOnly: true,
    },
};
app.get("/",(req, res)=>{
 res.redirect("/listings");       //basic api creation
});         



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());  //user related info store
passport.deserializeUser(User.deserializeUser()); //user related info unstore


app.use((req, res, next)=> {
    res.locals.success = req.flash("success");
     res.locals.error = req.flash("error");
     res.locals.currUser = req.user;   //current user session related information
    next();
});

//app.get("/demouser", async (req, res) => {
    //let fakeUser = new User ({
        //email: "student@gmail.com",
        //username: "delta-student"
    //});

    //let registeredUser = await User.register(fakeUser, "helloworld");
    //res.send(registeredUser);
//})

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

//pp.all("*", (req, res, next) => {
//next(new ExpressError(404, "Page not found"));
//});

app.use((err, req, res, next)=> {
    let {statusCode=500, message="Something went wrong!"}= err;
    res.status(statusCode).render("error.ejs", {message});
   });                                         //error handling middleware

app.listen(PORT, ()=>{
    console.log(`server is listening to port ${PORT}`);
});

