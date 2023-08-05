require("dotenv").config();

/*
|--------------------------------------------------------------------------
| Packages Definition
| express, cookieparser, bodyparser, cors
|--------------------------------------------------------------------------
|
|
*/
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");


/*
|
|--------------------------------------------------------------------------
| Defined Routes interception
|--------------------------------------------------------------------------
|
*/
const serverRoutes = require("./server" );


/*
|
|--------------------------------------------------------------------------
| Express App definition
|--------------------------------------------------------------------------
|
*/
const app = express();


/*
|
|--------------------------------------------------------------------------
| Define CORS options.
| This allows us set what the base url of our proxy api would be.
| It often advised to use the base url of our app because that is usually
| recognised as the request URL.
| Locally, it is usually http://localhost:PORT and live has a specific route.
|--------------------------------------------------------------------------
|
*/
const CORS_OPTIONS = {
    origin: process.env.NODE_ENV === "development" ? "http://localhost:2000" : process.env.APP_URL,
    credentials: true,
    methods: ["GET", "POSt"]
}

app.options("*", cors(CORS_OPTIONS));
app.disable("x-powered-by");
app.use(cors(CORS_OPTIONS));


/*
|
|--------------------------------------------------------------------------
| Intercepting request data and adding additional data the way you want.
| Access token is a very good example.
| next() is important otherwise we're stopping the route from proceeding
|--------------------------------------------------------------------------
|
*/
app.use((req, res, next) => {
    req.userToken = req.headers["your-token"];
    next();
});


/*
|
|--------------------------------------------------------------------------
| Setting app to use bodyparser and cookieparser to handle datatypes
|--------------------------------------------------------------------------
|
*/
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());


/*
|
|--------------------------------------------------------------------------
| Set up app to use defined route interceptions. This is key because you can
| set up a structure for your app to always look out for. If any route has
| the structure .../api/v1/..., iit will be intercepted and acted on based on
| defined logic in your server.js
|--------------------------------------------------------------------------
|
*/
app.use("/api/v1", serverRoutes);


/*
|
|--------------------------------------------------------------------------
| This is a test route to know your proxy server woks as expected by
| intercepting specified routes matching the format defined above.
| For this example, start the server and visit, http://localhost:9000
| in your browser, you'd get a page showing 'APP proxy server running'
|--------------------------------------------------------------------------
|
*/
app.get("/", (req, res) => {
    res.send("<h4>APP proxy server running</h4>");
});


/*
|
|--------------------------------------------------------------------------
| A way too know your proxy server is running in your terminal when you run
| >> nodemon server/index.js
|--------------------------------------------------------------------------
|
*/
app.listen(process.env.APP_PORT, () => {
    console.log(`APP proxy server is listening at port: ${process.env.APP_PORT}`);
});
