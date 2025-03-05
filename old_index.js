require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.port || 5000;
const app = express();

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
    await client.connect();

    const userCollection = client.db("gameDB").collection("userCollection");
    const gameCollection = client.db("gameDB").collection("gameCollection");
    const reviewCollection = client.db("gameDB").collection("reviewCollection");

    app.get("/games", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const getTitle = req.query.getTitle;
      console.log(getTitle);

      const sort = req.query.sort;
      let cursor = gameCollection.find().limit(limit);
      if (sort) {
        cursor = cursor.sort({ rating: sort });
      }
      const result = await cursor.toArray();

      if (getTitle) {
        const title = [];
        result.map((res) => title.push(res.title));
        res.send(title);
      } else {
        res.send(result);
      }
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await gameCollection.findOne(query);
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const limit = req.query.limit;
      const cursor = gameCollection.find();
      const allData = await cursor.toArray();
      const result = [];
      allData.map((data) =>
        data.reviews.map((dt) =>
          result.push({ id: data._id, title: data.title, ...dt })
        )
      );
      if (limit) {
        function getRandomReviews(arr) {
          const randomReview = arr.sort(() => 0.5 - Math.random());
          return randomReview.slice(0, 3);
        }
        res.send(getRandomReviews(result));
      } else {
        res.send(result);
      }
    });
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.post("/user", async (req, res) => {
      const userData = req.body;
      const filter = { email: userData.email };
      const options = { upsert: true };
      const upDateLastLogin = {
        $set: {
          name: userData.name,
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

    await client.db("admin").command({ ping: 1 });
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
