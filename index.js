require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.port || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zfqrz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const userCollection = client.db("gameDB").collection("userCollection");
    const reviewCollection = client.db("gameDB").collection("reviewCollection");
    const watchListCollection = client
      .db("gameDB")
      .collection("watchListCollection");

    app.get("/games", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const sort = req.query.sort;
      let cursor = reviewCollection.find().limit(limit);
      if (sort) {
        cursor = cursor.sort({ rating: sort });
      }
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/review", async (req, res) => {
      const { limit, email, filter } = req.query;
      let query = {};
      if (email) {
        query = { email: email };
      }

      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();

      if (limit) {
        // make the output dynamic, so avoid database limit() method
        function getRandomReviews(arr) {
          const randomReview = arr.sort(() => 0.5 - Math.random());
          return randomReview.slice(0, limit);
        }
        res.send(getRandomReviews(result));
      } else {
        res.send(result);
      }
    });
    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    app.put("/review/:id", async (req, res) => {
      const id = req.params.id;
      const {
        title,
        thumbnail,
        published_year,
        genre,
        rating,
        review,
        name,
        email,
      } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title,
          thumbnail,
          published_year,
          genre,
          rating,
          review,
          name,
          email,
        },
      };
      const result = await reviewCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/watchList", async (req, res) => {
      const query = { email: req.query.email };
      const options = { projection: { _id: 0, watchList: 1 } };
      const watchList = await watchListCollection.findOne(query, options);
      const cursor = reviewCollection.find();
      const allReview = await cursor.toArray();
      const result = allReview.filter((review) =>
        watchList?.watchList.includes(review._id.toString())
      );

      res.send(result);
    });
    app.put("/watchList/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { email: req.body.email };
      options = { upsert: true };
      const updateDoc = {
        $addToSet: {
          watchList: id,
        },
      };

      const result = await watchListCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const query = { email: req.query.email };
      const options = {
        projection: { _id: 0, photoUrl: 1 },
      };
      const result = await userCollection.findOne(query, options);
      res.send(result);
    });
    app.post("/user", async (req, res) => {
      const userData = req.body;
      const filter = { email: userData.email };
      const options = { upsert: true };
      const upDateLastLogin = {
        $set: {
          name: userData.name,
          photoUrl: userData.photoUrl,
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt,
        },
      };
      const result = await userCollection.updateOne(
        filter,
        upDateLastLogin,
        options
      );
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
