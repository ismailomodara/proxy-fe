/*
|--------------------------------------------------------------------------
| Define and use express router.
| This would allow use intercept routes based on our specified structure
|--------------------------------------------------------------------------
|
|
*/
const express = require("express");
const expressRouter = express.Router();

/*
|--------------------------------------------------------------------------
| Packages Definition
| axios, multer, request
|--------------------------------------------------------------------------
|
|
*/
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const request = require("request");


/*
|--------------------------------------------------------------------------
| Resetting request route
| In order to allow our proxy server handle our FE API calls, we are targeting
| routes that contain (/api/v1) - which is our defined pattern. Once we've
| successfully intercepted the request, we can reset the request route by
| removing the pattern.
|--------------------------------------------------------------------------
|
|
*/
expressRouter.use((req, res, next) => {
    req.originalUrl = req.originalUrl.replace("/api/v1/", "");
    next();
});


/*
|--------------------------------------------------------------------------
| Handles file uploads (multipart/form-data
|--------------------------------------------------------------------------
|
|
*/
const documentUploader = multer({ dest: "document_uploads" });


/*
|--------------------------------------------------------------------------
| Route interception and handling. There are different methods to do this.
| To make it easier for me, I implemented it in a way that I only look for
| api calls that are posts. The process:
| I define all my FE API calls as post (passing additional data of the actual
| action - GET, POST, PUT, DELETE.
| I intercept using the proxy server and process the correct method.
| This allows me to know that all post routes would always be API calls from
| the FE.
|--------------------------------------------------------------------------
|
*/
expressRouter.post("*", documentUploader.any(), (req, res) => {
    /*
    |--------------------------------------------------------------------------
    | Now you can use your actual api url - the client side of the app never
    | see this.
    |--------------------------------------------------------------------------
    |
    |
    */
    axios.defaults.baseURL = process.env.APP_API_URL;
    let reqPath = axios.defaults.baseURL;
    const token = req.userToken;

    if (token) axios.defaults.headers.common["Api-Token"] = token;


    /*
    |--------------------------------------------------------------------------
    | Extract information from the req data
    |--------------------------------------------------------------------------
    |
    |
    */
    const { body: payload, params, method } = req && req.body;

    if (method && method === "GET") {
        if (params) {
            reqPath = `${reqPath}?${params}`;
        }
        return axios
            .get(reqPath)
            .then(function(response) {
                if (response && response.data && response.data.status === "success") {
                    return res.send(response.data.data);
                }
                if (response && response.data && response.data.status === "error") {
                    return res.status(400).send(response.data);
                }
            })
            .catch(function(error) {
                const errData = error && error.response && error.response.data;

                if (errData) {
                    error.response.data.error = true;
                }

                return res.status(error.response.status ?? 400).send(errData);
            });
    }

    if (method && method === "PUT") {
        axios
            .put(reqPath, JSON.stringify(payload))
            .then(function(response) {
                if (response && response.data && response.data.status === "success") {
                    return res.send(response.data.data);
                }
                if (response && response.data && response.data.status === "error") {
                    return res.status(400).send(response.data);
                }
            })
            .catch(function(error) {
                const errData = error && error.response && error.response.data;

                if (errData) {
                    error.response.data.error = true;
                }
                return res.status(error.response.status ?? 400).send(errData);
            });
    }

    if (method && method === "POST") {
        axios
            .post(reqPath, payload)
            .then(function(response) {
                if (response && response.data && response.data.status === "success") {
                    return res.send(response.data.data);
                }
                if (response && response.data && response.data.status === "error") {
                    return res.status(400).send(response.data);
                }
            })
            .catch(function(error) {
                const errData = error && error.response && error.response.data;

                if (errData) {
                    error.response.data.error = true;
                }
                return res.status(error.response.status ?? 400).send(errData);
            });
    }

    if (req.files && req.files.length) {
        const files = {};
        req.files.forEach(file => {
            const filePath = path.join(__dirname, "..", file.path);
            files[file.fieldname] = fs.createReadStream(filePath);
        })

        request.post(
            {
                formData: {
                    ...req.body,
                    ...files
                },
                headers: {
                    "Api-Token": token,
                    "Content-Type": "multipart/form-data"
                },
                url: reqPath
            },
            (err, httpResponse, rawBody) => {
                Object.keys(files).forEach(file => {
                    fs.unlink(files[file].path, err => {
                        if (err) throw err
                    })
                })

                let body;

                try {
                    body = JSON.parse(rawBody);
                } catch (error) {
                    res.send(false);
                    return;
                }

                if (err) {
                    console.error("upload failed:", err);
                    return res.status(400).send(false);
                }

                if (body && body.status === "success") {
                    return res.send(body.data);
                }
                if (body && body.status === "error") {
                    return res.status(400).send(body);
                }
            }
        );
    }
});
module.exports = expressRouter;
