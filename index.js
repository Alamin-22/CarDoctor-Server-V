const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://cardoctor-7edc7.web.app",
        "https://cardoctor-7edc7.firebaseapp.com",
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());





const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.4hda1bm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares custom

const logger = async (req, res, next) => {
    console.log("called", req.hostname, req.originalUrl);
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.Token;
    // console.log("Value of token in middleware:", token)
    if (!token) {
        return res.status(401).send({ message: "Unauthorized" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        // error
        if (err) {
            console.log(err)
            return res.status(401).send({ message: " Unauthorized" })
        }

        // if token is valid than it would be decoded

        console.log("value in the token", decoded);
        req.user = decoded;
        next();
    })
}

// 
app.post("/log-out", async (req, res) => {
    const user = req.body;
    console.log("Logout User:", user);
    res.clearCookie("Token", {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite: "none",
    })
        .send({ success: true });
})


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        const ServicesCollection = client.db("CarDoctor").collection("services");
        const BookingCollection = client.db("CarDoctor").collection("Bookings");

        // auth related api



        // 
        app.post("/jwt", logger, async (req, res) => {
            const user = req.body;
            console.log("user for token on auth Api", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1h",
            });
            res.cookie("Token", token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",

            })
                .send({ success: true });
        })
        // logout







        //service

        app.get("/services", logger, async (req, res) => {
            const cursor = ServicesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const options = {
                projection: { img: 1, title: 1, price: 1, service_id: 1 },
            }
            const result = await ServicesCollection.findOne(query, options);
            res.send(result);
        })
        //  bookings

        app.get("/bookings", logger, verifyToken, async (req, res) => {
            console.log(req.query.email);
            // console.log("tu tu token", req.cookies.Token);
            console.log("Valid User Information:", req.user)

            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: "Forbidden Access" })
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await BookingCollection.find(query).toArray();
            res.send(result);
        })

        app.patch("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);

            const updatedDOC = {
                $set: {
                    status: updatedBooking.status,
                }
            };

            const result = await BookingCollection.updateOne(filter, updatedDOC);
            res.send(result);


        })




        app.post("/bookings", async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const result = await BookingCollection.insertOne(booking);
            res.send(result);

        })

        app.delete("/bookings/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await BookingCollection.deleteOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("Doctor Server Is Running")
})


app.listen(port, () => {
    console.log(`Car Doctor Server Is Running on : ${port}`)
})