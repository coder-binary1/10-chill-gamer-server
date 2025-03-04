require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

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

    app.post("/gameReview", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection(review);
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
